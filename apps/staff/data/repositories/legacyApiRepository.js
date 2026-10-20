import { useUIStore, useSnackbarStore } from '#imports'

export async function useApi(apiCall, successMessage = null, defaultValue = [], rethrow = false) {
  const ui = useUIStore()
  const snackbar = useSnackbarStore()
  try {
    ui.view2Show.isBusy = true
    const response = await apiCall()

    if (response?.error) {
      throw response.error
    }

    if (successMessage) {
      snackbar.trigger({ message: successMessage, color: 'success' })
    }
    // Return the data if it exists, otherwise the default
    return response || defaultValue

  } catch (e) {
    console.log(e.response?.status, e.response?.data)
    snackbar.trigger({ message: e.response?.data, color: 'error' })
    let errorMsg
    if (e.code === 'ECONNABORTED') {
      errorMsg = 'Request timed out'
    } else if (!e.response) {
      errorMsg = 'Network error — cannot reach server'
    } else {
      const data = e.response.data
      let raw
      if (typeof data === 'string' && data) {
        raw = data                          // plain text body
      } else if (data && typeof data === 'object') {
        raw = data.message || data.error || JSON.stringify(data)  // JSON body
      } else {
        raw = e.message                     // fallback: "Request failed with status code 500"
      }
      errorMsg = raw.split(';')[0] || 'Server Error'
    }
    if (rethrow) throw e
    return defaultValue
  } finally {
    ui.view2Show.isBusy = false
  }
}

function getDirectToken() {
  if (typeof document === 'undefined') return ''
  const value = `; ${document.cookie}`
  const parts = value.split(`; wsu_auth_token=`)
  if (parts.length === 2) {
    const rawToken = parts.pop()?.split(';').shift() || ''
    return decodeURIComponent(rawToken).replace(/^"|"$/g, '')
  }
  return ''
}

export async function useDirectApi(funcName, params = [], orderBy) {
  const ui = useUIStore()
  const snackbar = useSnackbarStore()

  try {
    ui.view2Show.isBusy = true
    const token = getDirectToken()

    let url = `https://mywsu.vn:2096/API/selectdata?funcName=${funcName}`

    if (orderBy) {
      url += `&orderBy=${encodeURIComponent(orderBy)}`
    }
    const paramArray = Array.isArray(params) ? params : [params]
    paramArray.forEach((param, index) => {
      if (param !== undefined && param !== null) {
        const serializedValue = typeof param === 'object' ? JSON.stringify(param) : param
        url += `&para${index + 1}=${encodeURIComponent(serializedValue)}`
      }
    })

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(errorText || `Server returned status ${response.status}`)
    }

    const data = await response.json()
    return Array.isArray(data) ? data : (data.result || [])

  } catch (error) {
    console.error(`[useDirectApi Error - ${funcName}]:`, error.message || error)
    snackbar.trigger({ message: error.message || 'API request failed', color: 'error' })
    return []
  } finally {
    ui.view2Show.isBusy = false
  }
}
