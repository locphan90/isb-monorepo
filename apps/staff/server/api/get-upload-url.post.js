import { google } from 'googleapis'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { fileName, mimeType, folderID } = body
  const config = useRuntimeConfig()
  const requestOrigin = getRequestHeader(event, 'origin') || 'http://localhost:3000'

  try {
    const rawCredentials = config.googleServiceAccountJson || process.env.GOOGLE_SERVICE_ACCOUNT_JSON

    if (!rawCredentials) {
      throw new Error('GOOGLE_SERVICE_ACCOUNT_JSON is missing or undefined.')
    }

    const credentials = typeof rawCredentials === 'string'
      ? JSON.parse(rawCredentials)
      : rawCredentials

    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/drive'],
    })

    const token = await auth.getAccessToken()

    const response = await fetch(
      'https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable&supportsAllDrives=true',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Upload-Content-Type': mimeType,
          'Content-Type': 'application/json',
          'Origin': requestOrigin,
        },
        body: JSON.stringify({
          name: fileName,
          parents: [folderID],
        }),
      }
    )

    const uploadUrl = response.headers.get('Location') || response.headers.get('location')

    if (!uploadUrl) {
      const errBody = await response.text()
      console.error('Google API Error Response:', errBody)
      throw new Error(`Google API Error (${response.status}): ${errBody}`)
    }

    return { uploadUrl }
  } catch (error) {
    console.error('Server Upload Handler Error:', error)
    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Failed to initialize Google Drive upload',
    })
  }
})
