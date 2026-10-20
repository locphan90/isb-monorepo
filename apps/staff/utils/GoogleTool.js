import axios from 'axios'

export async function notifyGChat(msg) {
  try {
    const userStore = useUserStore()
    const gChatId = userStore.user?.domainInfo?.gChatId

    if (!gChatId) {
      console.warn('No Google Chat webhook ID found for current domain.')
      return
    }

    const fullUrl = gChatId.startsWith('http')
      ? gChatId
      : `https://chat.googleapis.com/v1/spaces/${gChatId}`

    await axios.post(fullUrl, { text: msg })
  } catch (err) {
    console.error('Error sending message:', err.response?.data || err.message)
  }
}

export async function useGoogleFormSubmit(formData) {
  const { ui } = useAppStores()
  ui.view2Show.isBusy = true
  const formID = "1FAIpQLSf7V6b6lC0BfdPRGQr7XVIrhS-zuoEAmbaFobgElGooEG6irA"
  const url = `https://docs.google.com/forms/d/e/${formID}/formResponse`
  const body = new FormData()
  body.append('entry.1474753168', formData[0])
  body.append('entry.951274246',  formData[1])
  body.append('entry.1328420953', formData[2])
  body.append('entry.1782479951', formData[3])  // JSON goes here safely
  body.append('entry.803556974',  formData[4])
  body.append('entry.1767855489', formData[5])

  try {
    await fetch(url, { method: 'POST', mode: 'no-cors', body })
    ui.view2Show.isBusy = false
    return { success: true }
  } catch (error) {
    console.error('Form submission error:', error)
    ui.view2Show.isBusy = false
    return { success: false }
  }
}

export async function Client_UploadToGoogleDrive(selectedFile, folderID, fileNameModifier) {
  const { ui } = useAppStores()
  ui.view2Show.isBusy = true
  try {
    let updatedFileName = selectedFile.name
    if (fileNameModifier) {
      updatedFileName = fileNameModifier + '_' + updatedFileName
    }

    const { uploadUrl } = await $fetch('/api/get-upload-url', {
      method: 'POST',
      body: {
        fileName: updatedFileName,
        mimeType: selectedFile.type,
        folderID: folderID
      }
    })

    const googleResponse = await fetch(uploadUrl, {
      method: 'PUT',
      body: selectedFile
    })

    if (!googleResponse.ok) {
      throw new Error(`Upload Status: ${googleResponse.status}`)
    }

    const driveData = await googleResponse.json()

    ui.view2Show.isBusy = false
    return {
      fileId: driveData.id,
      fileName: driveData.name
    }

  } catch (error) {
    console.error('Frontend Upload Error:', error)
  } finally {
    ui.view2Show.isBusy = false
  }
}
