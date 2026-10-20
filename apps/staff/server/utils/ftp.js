// server/utils/ftp.js
import SftpClient from "ssh2-sftp-client";

export function resolveMimeType(fileName) {
  const ext = fileName.split(".").pop()?.toLowerCase();
  switch (ext) {
    case "pdf": return "application/pdf";
    case "png": return "image/png";
    case "jpg":
    case "jpeg": return "image/jpeg";
    case "webp": return "image/webp";
    default: return "application/octet-stream";
  }
}

/**
 * 1. Used by batch-verify-certificates.post.js
 * Scans student directories and downloads single matching files (e.g., english_cer.*)
 */
export async function fetchStudentFiles(mssvList, filePrefix) {
  const sftp = new SftpClient();
  const results = [];
  const basePath = "/home/servers/main/data/profile";

  try {
    await sftp.connect({
      host: process.env.FTP_HOST,
      port: 2018,
      username: process.env.FTP_USER,
      password: process.env.FTP_PASSWORD,
      readyTimeout: 20000
    });

    for (const mssv of mssvList) {
      const studentFolder = `${basePath}/${mssv}`;
      try {
        const fileList = await sftp.list(studentFolder);
        const targetFile = fileList.find(
          (f) => f.type === "-" && f.name.toLowerCase().startsWith(filePrefix.toLowerCase())
        );

        if (!targetFile) {
          results.push({
            mssv,
            found: false,
            error: `File starting with '${filePrefix}' not found in '${mssv}'`
          });
          continue;
        }

        const buffer = await sftp.get(`${studentFolder}/${targetFile.name}`);

        results.push({
          mssv,
          found: true,
          fileName: targetFile.name,
          mimeType: resolveMimeType(targetFile.name),
          fileBuffer: buffer
        });
      } catch (err) {
        results.push({
          mssv,
          found: false,
          error: err.message || `Could not access ${studentFolder}`
        });
      }
    }

    return results;
  } finally {
    await sftp.end();
  }
}

/**
 * 2. Used by batch-verify-idcards.post.js
 * Scans and downloads 1 or 2 ID card files (e.g. id_card.*, id_card_front.*, id_card_back.*)
 */
export async function fetchStudentIdCardFiles(mssvList) {
  const sftp = new SftpClient();
  const results = [];
  const basePath = "/home/servers/main/data/profile";

  try {
    await sftp.connect({
      host: process.env.FTP_HOST,
      port: 2018,
      username: process.env.FTP_USER,
      password: process.env.FTP_PASSWORD,
      readyTimeout: 20000
    });

    for (const mssv of mssvList) {
      const studentFolder = `${basePath}/${mssv}`;
      try {
        const fileList = await sftp.list(studentFolder);

        // Find files starting with id_card, idcard, cccd, or cmnd
        const matchingFiles = fileList.filter(
          (f) => f.type === "-" && /^(id_card|idcard|cccd|cmnd)/i.test(f.name)
        );

        if (matchingFiles.length === 0) {
          results.push({
            mssv,
            found: false,
            files: [],
            error: "No ID card files found (expected prefix 'id_card.')"
          });
          continue;
        }

        // Limit to at most 2 files (front + back)
        const selectedFiles = matchingFiles.slice(0, 2);
        const downloadedFiles = [];

        for (const file of selectedFiles) {
          const buffer = await sftp.get(`${studentFolder}/${file.name}`);
          downloadedFiles.push({
            fileName: file.name,
            mimeType: resolveMimeType(file.name),
            fileBuffer: buffer
          });
        }

        results.push({
          mssv,
          found: true,
          files: downloadedFiles
        });
      } catch (err) {
        results.push({
          mssv,
          found: false,
          files: [],
          error: err.message || `Could not access ${studentFolder}`
        });
      }
    }

    return results;
  } finally {
    await sftp.end();
  }
}
