import { GoogleGenAI, Type } from '@google/genai'

// --- Vertex AI Configuration ---
let googleAuthOptions = {};

if (process.env.GCP_SERVICE_ACCOUNT_KEY) {
  try {
    const creds = typeof process.env.GCP_SERVICE_ACCOUNT_KEY === 'string'
      ? JSON.parse(process.env.GCP_SERVICE_ACCOUNT_KEY)
      : process.env.GCP_SERVICE_ACCOUNT_KEY;

    googleAuthOptions = {
      credentials: {
        client_email: creds.client_email,
        private_key: creds.private_key ? creds.private_key.replace(/\\n/g, '\n') : undefined,
      },
      scopes: ['https://www.googleapis.com/auth/cloud-platform'],
    };
  } catch (e) {
    console.error('Failed to parse GCP_SERVICE_ACCOUNT_KEY env variable:', e);
  }
}

const geminiAi = new GoogleGenAI({
  vertexai: true,
  project: process.env.GCP_PROJECT_ID,
  location: 'asia-southeast1',
  googleAuthOptions,
});

const EXTRACTION_PROMPT = `You are extracting student records from a scanned document.
The layout varies between documents: it may be a bordered table, a plain list,
or even an email body. There may or may not be a header row. Ignore everything
that is not a student record: headers, greetings, sign-offs, dates, page numbers,
and notes like "Sent from CA".

Each student record contains:
- id: the student ID number (8 digits, starts with "22"). Return it as a string.
- full_name: the person's complete name, surname first, in natural reading order
  (e.g. "NGUYEN Huynh Thanh Tam"). Join surname and given names with a single
  space and collapse any line breaks from wrapped text.

Return ONLY a raw JSON array of objects with keys "id" and "full_name".
If no records are found, return [].`

export default defineEventHandler(async (event) => {
  const form = await readMultipartFormData(event)
  const pdfPart = form?.find(
    (part) => part.type === 'application/pdf' || part.filename?.endsWith('.pdf'),
  )

  if (!pdfPart) {
    throw createError({
      statusCode: 400,
      statusMessage: 'No PDF file found in the request.',
    })
  }

  const base64Pdf = pdfPart.data.toString('base64')

  // Extract using Gemini on Vertex AI
  const rawText = await extractWithGemini(base64Pdf)

  const rows = parseRows(rawText)
  if (rows === null) {
    throw createError({
      statusCode: 502,
      statusMessage: 'Model did not return valid JSON.',
      data: { raw: rawText },
    })
  }

  return { rows, count: rows.length }
})

// --- Robust JSON parsing ---
function parseRows(rawText) {
  const cleaned = rawText.replace(/```json\s*|\s*```/g, '').trim()
  try {
    return JSON.parse(cleaned)
  } catch {
    const match = cleaned.match(/\[[\s\S]*\]/)
    if (match) {
      try {
        return JSON.parse(match[0])
      } catch {
        return null
      }
    }
    return null
  }
}

// --- Gemini via Vertex AI SDK ---
async function extractWithGemini(base64Pdf) {
  const response = await geminiAi.models.generateContent({
    model: 'gemini-2.5-flash-lite',
    contents: [
      {
        role: 'user',
        parts: [
          {
            inlineData: {
              mimeType: 'application/pdf',
              data: base64Pdf,
            },
          },
          { text: EXTRACTION_PROMPT },
        ],
      },
    ],
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            id: { type: Type.STRING },
            full_name: { type: Type.STRING },
          },
          required: ['id', 'full_name'],
        },
      },
    },
  });

  return response.text || ''
}
