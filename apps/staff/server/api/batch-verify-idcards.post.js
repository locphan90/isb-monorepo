// server/api/batch-verify-idcards.post.js
import { fetchStudentIdCardFiles } from '../utils/ftp.js';

// Helper: Sleep utility
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Helper: Fetch with automatic retry on 429 Resource Exhausted
async function fetchWithRetry(url, options, maxRetries = 3, baseDelay = 1500) {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await $fetch(url, options);
    } catch (err) {
      const is429 = err?.status === 429 || err?.statusCode === 429 || err?.message?.includes('429') || err?.message?.includes('RESOURCE_EXHAUSTED');
      
      if (is429 && attempt < maxRetries) {
        // Exponential backoff with jitter: 1.5s -> 3s -> 6s...
        const delay = baseDelay * Math.pow(2, attempt) + Math.random() * 500;
        console.warn(`[429 Rate Limit] Retrying in ${Math.round(delay)}ms (Attempt ${attempt + 1}/${maxRetries})...`);
        await sleep(delay);
        continue;
      }
      throw err;
    }
  }
}

// Helper: Run tasks with a strict concurrency ceiling (e.g. 3 concurrent max)
async function mapConcurrent(items, limit, fn) {
  const results = [];
  let index = 0;

  async function worker() {
    while (index < items.length) {
      const i = index++;
      results[i] = await fn(items[i], i);
    }
  }

  const workers = Array.from({ length: Math.min(limit, items.length) }, () => worker());
  await Promise.all(workers);
  return results;
}

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

  // 1. Fetch ID card files from SFTP into memory
  let fetchedItems = [];
  try {
    fetchedItems = await fetchStudentIdCardFiles(mssvList);
  } catch (sftpErr) {
    console.error("SFTP Fetch Error:", sftpErr);
    throw createError({
      statusCode: 500,
      statusMessage: `SFTP Connection/Read Failed: ${sftpErr.message}`,
    });
  }

  // 2. Dispatch to /api/extract-vn-id with concurrency of 3 and 429 retry
  const results = await mapConcurrent(fetchedItems, 3, async (item) => {
    if (!item.found || item.files.length === 0) {
      return {
        mssv: item.mssv,
        status: "FILE_NOT_FOUND",
        error: item.error
      };
    }

    try {
      const boundary = `----NitroBoundary${Date.now().toString(16)}${Math.random().toString(16).slice(2)}`;
      const bodyParts = [];

      for (const file of item.files) {
        const header = Buffer.from(
          `--${boundary}\r\n` +
          `Content-Disposition: form-data; name="file"; filename="${file.fileName}"\r\n` +
          `Content-Type: ${file.mimeType}\r\n\r\n`
        );
        bodyParts.push(header, file.fileBuffer, Buffer.from("\r\n"));
      }

      bodyParts.push(Buffer.from(`--${boundary}--\r\n`));
      const multipartBody = Buffer.concat(bodyParts);

      // Call extraction route using retry-safe wrapper
      const idCardData = await fetchWithRetry("/api/extract-vn-id", {
        method: "POST",
        headers: {
          "Content-Type": `multipart/form-data; boundary=${boundary}`,
          "Accept": "application/json"
        },
        body: multipartBody
      });

      // Small pacing buffer between requests
      await sleep(200);

      return {
        mssv: item.mssv,
        status: "SUCCESS",
        idCardData
      };
    } catch (parseErr) {
      return {
        mssv: item.mssv,
        status: "PARSE_ERROR",
        error: parseErr.data?.statusMessage || parseErr.data?.message || parseErr.message
      };
    }
  });

  return { total: mssvList.length, results };
});
