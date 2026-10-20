// server/api/ielts-reading-vertex.post.js
import { GoogleGenAI } from '@google/genai';

let googleAuthOptions = {};

// Parse stringified JSON from environment variable (production or local .env)
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

// Initialize official @google/genai client targeting Vertex AI
const gemini = new GoogleGenAI({
  vertexai: true,
  project: process.env.GCP_PROJECT_ID,
  location: 'asia-southeast1',
  googleAuthOptions,
});
const GEMINI_MODEL = 'gemini-2.5-flash';
const MAX_OUTPUT_TOKENS = 2048;

export default defineEventHandler(async (event) => {
  const form = await readMultipartFormData(event);
  const file = form?.find((p) => p.name === 'file');

  if (!file) {
    throw createError({ statusCode: 400, statusMessage: 'file is required' });
  }

  // Detect incoming file MIME type, or fallback dynamically based on extension/magic bytes
  let detectedMimeType = file.type;
  if (!detectedMimeType || detectedMimeType === 'application/octet-stream') {
    detectedMimeType = file.filename?.toLowerCase().endsWith('.pdf') ? 'application/pdf' : 'image/jpeg';
  }

  // Convert buffer to Base64 string for Gemini inlineData
  const base64Data = file.data.toString('base64');

  let response;
  try {
    response = await gemini.models.generateContent({
      model: GEMINI_MODEL,
      contents: [
        {
          role: 'user',
          parts: [
            {
              inlineData: {
                data: base64Data, // Attach binary payload
                mimeType: detectedMimeType, // Dynamic MIME type (image/jpeg or application/pdf)
              },
            },
            { text: EXTRACTION_PROMPT },
          ],
        },
      ],
      config: {
        responseMimeType: 'application/json',
        responseSchema: GEMINI_SCHEMA, // 👈 MODIFIED: Fixed property name
        maxOutputTokens: MAX_OUTPUT_TOKENS,
        thinkingConfig: {
          thinkingBudget: 0, // 👈 MODIFIED: Added to eliminate the ~3-5s thinking delay
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

  const blockReason = response.promptFeedback?.blockReason;
  if (blockReason) {
    console.error('Gemini blocked the prompt. Feedback:', JSON.stringify(response.promptFeedback));
    throw createError({ statusCode: 502, statusMessage: `Gemini blocked the prompt (${blockReason})` });
  }

  const finishReason = response.candidates?.[0]?.finishReason;
  if (finishReason === 'MAX_TOKENS') {
    throw createError({
      statusCode: 502,
      statusMessage: `response truncated at ${MAX_OUTPUT_TOKENS} tokens — raise MAX_OUTPUT_TOKENS`,
    });
  }
  if (finishReason && finishReason !== 'STOP') {
    console.error('Gemini stopped abnormally. finishReason:', finishReason,
      'safetyRatings:', JSON.stringify(response.candidates?.[0]?.safetyRatings));
    throw createError({ statusCode: 502, statusMessage: `Gemini stopped: ${finishReason}` });
  }

  const raw = response.text;
  if (!raw) {
    throw createError({ statusCode: 502, statusMessage: 'no text in Gemini response' });
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
