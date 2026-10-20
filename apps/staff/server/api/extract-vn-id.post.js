// server/api/extract-vn-id.post.js
import { GoogleGenAI, Type } from '@google/genai';

// Đọc service account từ biến môi trường GOOGLE_SERVICE_ACCOUNT_JSON
const rawKey = process.env.GCP_SERVICE_ACCOUNT_KEY;
if (!rawKey) {
  throw new Error('Missing GCP_SERVICE_ACCOUNT_KEY in env');
}

let creds;
try {
  creds = JSON.parse(rawKey);
} catch (e) {
  throw new Error('GCP_SERVICE_ACCOUNT_KEY is not valid JSON: ' + e.message);
}

const googleAuthOptions = {
  credentials: {
    client_email: creds.client_email,
    // JSON.parse đã đổi \n thành xuống dòng thật, replace chỉ để phòng trường hợp bị escape 2 lần
    private_key: creds.private_key?.replace(/\\n/g, '\n'),
  },
  scopes: ['https://www.googleapis.com/auth/cloud-platform'],
};

const gemini = new GoogleGenAI({
  vertexai: true,
  // Lấy project từ chính file key, không cần thêm biến GCP_PROJECT_ID
  project: process.env.GCP_PROJECT_ID || creds.project_id,
  location: 'asia-southeast1',
  googleAuthOptions,
});

const GEMINI_MODEL = 'gemini-2.5-flash';
const MAX_OUTPUT_TOKENS = 2048;

const MIME_BY_EXT = {
  pdf: 'application/pdf',
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  webp: 'image/webp',
};

function resolveMime(part) {
  if (part.type && part.type !== 'application/octet-stream') {
    return part.type.toLowerCase();
  }
  const ext = (part.filename || '').toLowerCase().split('.').pop() || '';
  return MIME_BY_EXT[ext] || 'image/jpeg';
}

const EXTRACTION_PROMPT = `Extract structured identity data from the uploaded document (Vietnamese Citizen ID Card / CCCD, Vietnamese Passport, or International Passport).

--------------------------------------------------
DOCUMENT TYPE 1: PASSPORT (Vietnamese or International)
--------------------------------------------------
Read the 2-line ICAO 9303 TD3 Machine Readable Zone (MRZ) at the bottom of the passport page.
The MRZ uses OCR-B font and MUST be prioritized over the visual text to avoid OCR errors.

MRZ Line 1:
  P<CCC[SURNAME]<<[GIVEN_NAMES]<<<<<<<<<<<<<<<<<<<<...
  - Extract Full Name: combine Surname and Given names. If diacritics are readable in the visual area above, preserve them (e.g. "HÀ VÂN ANH"). Otherwise uppercase "HA VAN ANH".

MRZ Line 2 (44 characters):
  Pos 1-9:   Passport Number (e.g. "E00451696") -> map to "passport_number"
  Pos 10:    Check digit (ignore)
  Pos 11-13: Nationality code (e.g. "VNM" -> "VIETNAMESE") -> map to "nationality"
  Pos 14-19: Date of Birth in YYMMDD format. Convert YYMMDD to YYYY-MM-DD:
             Example: "080930" -> "2008-09-30" (year 08 = 2008, month 09, day 30) -> map to "dob"
  Pos 20:    Check digit (ignore)
  Pos 21:    Sex ("M" -> "Nam", "F" -> "Nữ") -> map to "gender"
  Pos 22-27: Expiration Date in YYMMDD format. Convert YYMMDD to YYYY-MM-DD:
             Example: "330713" -> "2033-07-13" -> map to "expiry_date"
  Pos 28:    Check digit (ignore)
  Pos 29-40: National ID Number / Số ĐDCN / CMND (12 digits, e.g. "079308001232"). Ignore trailing '<'.
             CRITICAL: THIS 12-DIGIT NATIONAL ID NUMBER MUST BE RETURNED AS "id_number".

Passport Fields Mapping:
- document_type: "PASSPORT"
- id_number: 12-digit National ID number extracted from MRZ Pos 29-40 (e.g. "079308001232"). If not present on foreign passport, return the personal ID or "".
- passport_number: Passport number from MRZ Pos 1-9 (e.g. "E00451696").
- full_name: Full name from MRZ / visual area (e.g. "HÀ VÂN ANH")
- gender: "Nam" or "Nữ"
- nationality: "VIETNAMESE" or country name
- dob: Decoded DOB YYYY-MM-DD from MRZ Pos 14-19
- origin: Value under "Nơi sinh / Place of birth" (e.g. "TP. Hồ Chí Minh")
- residence: ""
- issue_date: Date under "Ngày cấp / Date of issue" formatted as YYYY-MM-DD
- expiry_date: Decoded Expiry YYYY-MM-DD from MRZ Pos 22-27

--------------------------------------------------
DOCUMENT TYPE 2: CITIZEN ID CARD (CCCD / CĂN CƯỚC)
--------------------------------------------------
- document_type: "ID_CARD"
- id_number: 12-digit number on FRONT (under "Số / No." or "Số định danh cá nhân / Personal Identification number").
- passport_number: ""
- full_name: Full name on FRONT in UPPERCASE with Vietnamese diacritics.
- gender: "Nam" or "Nữ"
- nationality: "VIỆT NAM"
- dob: Date of birth on FRONT (DD/MM/YYYY -> YYYY-MM-DD).
- origin: Value after "Quê quán" (old) or "Nơi sinh" (new).
- residence: Value after "Nơi thường trú" (old) or "Nơi cư trú" (new).
- issue_date: Date on BACK after "Ngày, tháng, năm" -> YYYY-MM-DD.
- expiry_date: ""

CRITICAL RULES:
- "id_number" is ALWAYS the 12-digit citizen/national ID number.
- "passport_number" holds the passport book number (e.g. "E00451696").
- Output strictly valid JSON matching the schema.`;

const GEMINI_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    document_type: {
      type: Type.STRING,
      enum: ['ID_CARD', 'PASSPORT'],
    },
    id_number: {
      type: Type.STRING,
      description: 'The 12-digit National ID (CCCD/CMND/Số ĐDCN) number found on CCCD or MRZ Pos 29-40',
    },
    passport_number: {
      type: Type.STRING,
      description: 'The Passport book number (e.g. E00451696) or empty string for ID cards',
    },
    full_name: {
      type: Type.STRING,
      description: 'Full name in uppercase with Vietnamese diacritics',
    },
    gender: {
      type: Type.STRING,
      enum: ['Nam', 'Nữ'],
    },
    nationality: {
      type: Type.STRING,
    },
    dob: {
      type: Type.STRING,
      description: 'Date of birth formatted as YYYY-MM-DD',
    },
    origin: {
      type: Type.STRING,
      description: 'Place of origin / Place of birth or empty string',
    },
    residence: {
      type: Type.STRING,
      description: 'Place of residence address or empty string',
    },
    issue_date: {
      type: Type.STRING,
      description: 'Issue date formatted as YYYY-MM-DD or empty string',
    },
    expiry_date: {
      type: Type.STRING,
      description: 'Expiry date formatted as YYYY-MM-DD or empty string',
    },
  },
  required: [
    'document_type',
    'id_number',
    'passport_number',
    'full_name',
    'gender',
    'nationality',
    'dob',
    'origin',
    'residence',
    'issue_date',
    'expiry_date',
  ],
};

export default defineEventHandler(async (event) => {
  const form = await readMultipartFormData(event);
  const files = (form || []).filter(
    (p) => p.data?.length && (p.filename || p.name === 'file' || p.name === 'files')
  );

  if (files.length < 1 || files.length > 2) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Upload 1 or 2 files (one PDF, or 1-2 images for front/back)',
    });
  }

  const pdfCount = files.filter((f) => resolveMime(f) === 'application/pdf').length;
  if (pdfCount > 1) {
    throw createError({
      statusCode: 400,
      statusMessage: 'At most one PDF is allowed',
    });
  }
  if (files.length === 2 && pdfCount === 1) {
    throw createError({
      statusCode: 400,
      statusMessage: 'When uploading two files, both must be images (front + back)',
    });
  }

  const fileParts = files.map((file) => ({
    inlineData: {
      data: file.data.toString('base64'),
      mimeType: resolveMime(file),
    },
  }));

  let response;
  try {
    response = await gemini.models.generateContent({
      model: GEMINI_MODEL,
      contents: [
        {
          role: 'user',
          parts: [
            ...fileParts,
            { text: EXTRACTION_PROMPT },
          ],
        },
      ],
      config: {
        responseMimeType: 'application/json',
        responseSchema: GEMINI_SCHEMA,
        maxOutputTokens: MAX_OUTPUT_TOKENS,
        thinkingConfig: {
          thinkingBudget: 0,
        },
      },
    });
  } catch (err) {
    console.error('Gemini Vertex API error:', err);
    throw createError({
      statusCode: err.status || 500,
      statusMessage: err.message || 'Gemini API call failed',
      data: { geminiError: err.message },
    });
  }

  const raw = response.text;
  if (!raw) {
    throw createError({ statusCode: 502, statusMessage: 'No text in Gemini response' });
  }

  let extracted;
  try {
    extracted = JSON.parse(raw);
  } catch (parseErr) {
    console.error('JSON parse failed. Raw text was:', raw);
    throw createError({ statusCode: 502, statusMessage: 'Gemini returned unparseable JSON' });
  }

  return extracted;
});
