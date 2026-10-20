import { defineEventHandler, getQuery, createError } from 'h3';
import axios from 'axios';
import qs from 'qs';

// --- Token Caching Logic (Kept in memory per lambda instance) ---
let cachedToken = null;
let tokenExpiry = 0;

async function getToken() {
  const now = Date.now();
  if (cachedToken && now < tokenExpiry) return cachedToken;

  const data = qs.stringify({
    username: process.env.OCB_USERNAME,
    password: process.env.OCB_PASSWORD,
    grant_type: "password",
    client_id: process.env.OCB_CLIENT_ID,
    client_secret: process.env.OCB_CLIENT_SECRET,
  });

  const response = await axios.post(
    `${process.env.OCB_API_URL}/authentication/oauth2/token`, 
    data, 
    { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
  );

  const { access_token, expires_in } = response.data;
  cachedToken = access_token;
  tokenExpiry = now + (expires_in * 1000) - 10000; // 10s buffer

  return cachedToken;
}

// --- Main Nitro API Handler ---
export default defineEventHandler(async (event) => {
  // 1. Parse query parameters from the request
  const body = await readBody(event);
  const student_code = body.student_code;
  const period_code = body.period_code || "any";  

  if (!student_code) {
    throw createError({
      statusCode: 400,
      statusMessage: "Missing student_code parameter",
    });
  }

  try {
    // 2. Fetch the OAuth token
    const token = await getToken();

    // 3. Request data from your external OCB API
    const response = await axios.get(`${process.env.OCB_API_URL}/custom/invoice`, {
      headers: { Authorization: `Bearer ${token}` },
      params: { student_code, period_code },
    });

    // 4. Return the data (Nitro automatically handles JSON stringification)
    return response.data;

  } catch (error) {
    console.error("Invoice API error:", error?.response?.data || error.message);
    
    throw createError({
      statusCode: 500,
      statusMessage: "Error Getting Data from OCB",
    });
  }
});