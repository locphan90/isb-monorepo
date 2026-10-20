import { GoogleGenAI, Type } from '@google/genai';
import { defineEventHandler, readMultipartFormData, createError } from 'h3';

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
const ai = new GoogleGenAI({
  vertexai: true,
  project: process.env.GCP_PROJECT_ID,
  location: 'asia-southeast1',
  googleAuthOptions,
});

export default defineEventHandler(async (event) => {
  const formData = await readMultipartFormData(event);
  const file = formData?.find((item) => item.name === 'file');

  if (!file || !file.data) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Vui lòng tải lên một tệp tin (PDF/Hình ảnh).',
    });
  }

  try {
    const prompt = `Bạn là chuyên gia trích xuất dữ liệu văn bản hành chính Việt Nam. Hãy đọc tài liệu đính kèm và trích xuất tất cả danh sách học sinh/sinh viên.

Yêu cầu dữ liệu:
1. FullName: Họ và tên đầy đủ của học sinh/sinh viên/công dân.
2. DOB: Ngày tháng năm sinh. Chuyển đổi định dạng về ISO 8601 (yyyy-mm-dd). Ví dụ: 09/06/2005 -> 2005-06-09.
3. MSSV: Mã số sinh viên / Mã học sinh (Loại bỏ các tiền tố như "MSSV:", "Mã số sinh viên:"). Nếu không có mã thì trả về null.
4. IDCard: Số Căn cước công dân / Số Căn cước / Số CMND (Loại bỏ các tiền tố như "CCCD:", "Số Căn cước:", "CMND:", "Số:"). Nếu không có thông tin này thì trả về null.`;

    const mimeType = file.type || 'application/pdf';

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        {
          role: 'user',
          parts: [
            {
              inlineData: {
                mimeType: mimeType,
                data: file.data.toString('base64'),
              },
            },
            { text: prompt },
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
              FullName: { type: Type.STRING },
              DOB: { type: Type.STRING },
              MSSV: { type: Type.STRING, nullable: true },
              IDCard: { type: Type.STRING, nullable: true },
            },
            required: ['FullName', 'DOB'],
          },
        },
      },
    });

    const rawText = response.text || '[]';
    const students = JSON.parse(rawText);

    return {
      success: true,
      total: Array.isArray(students) ? students.length : 0,
      data: students,
    };
  } catch (error) {
    console.error('Lỗi chi tiết từ Gemini/Nitro:', error);

    const errorMessage = error?.message || 'Lỗi không xác định';
    
    throw createError({
      statusCode: error?.status || 500,
      statusMessage: `Lỗi xử lý tệp: ${errorMessage}`,
    });
  }
});
