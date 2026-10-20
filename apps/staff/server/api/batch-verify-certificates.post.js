// Add this exact line at the very top:
import { fetchStudentFiles } from '../utils/ftp.js';

export default defineEventHandler(async (event) => {
  let mssvList = [];

  try {
    const body = await readBody(event);
    mssvList = body?.mssvList || [];
  } catch (err) {
    throw createError({ statusCode: 400, statusMessage: "Invalid JSON request body" });
  }

  if (!Array.isArray(mssvList) || mssvList.length === 0) {
    throw createError({ statusCode: 400, statusMessage: "Invalid or empty mssvList" });
  }

  // 1. Fetch certificate files from SFTP
  let fetchedFiles = [];
  try {
    fetchedFiles = await fetchStudentFiles(mssvList, "english_cer.");
  } catch (sftpErr) {
    console.error("SFTP Fetch Error:", sftpErr);
    throw createError({
      statusCode: 500,
      statusMessage: `SFTP Connection/Read Failed: ${sftpErr.message}`,
    });
  }

  // 2. Dispatch to your existing Vertex route with multipart boundary
  const results = await Promise.all(
    fetchedFiles.map(async (item) => {
      if (!item.found || !item.fileBuffer) {
        return {
          mssv: item.mssv,
          status: "FILE_NOT_FOUND",
          error: item.error,
        };
      }

      try {
        const boundary = `----NitroBoundary${Date.now().toString(16)}${Math.random().toString(16).slice(2)}`;
        
        const header = Buffer.from(
          `--${boundary}\r\n` +
          `Content-Disposition: form-data; name="file"; filename="${item.fileName}"\r\n` +
          `Content-Type: ${item.mimeType}\r\n\r\n`
        );
        const footer = Buffer.from(`\r\n--${boundary}--\r\n`);
        const multipartBody = Buffer.concat([header, item.fileBuffer, footer]);

        const certificateData = await $fetch("/api/ielts-reading-vertex", {
          method: "POST",
          headers: {
            "Content-Type": `multipart/form-data; boundary=${boundary}`,
            "Accept": "application/json",
          },
          body: multipartBody,
        });

        return {
          mssv: item.mssv,
          status: "SUCCESS",
          certificateData,
        };
      } catch (parseErr) {
        return {
          mssv: item.mssv,
          status: "PARSE_ERROR",
          error: parseErr.data?.statusMessage || parseErr.data?.message || parseErr.message,
        };
      }
    })
  );

  return { total: mssvList.length, results };
});
