// utils/apiWapper.js
export async function useApi(apiCall, successMessage = null, defaultValue = [], rethrow=false) {
    const ui = useUIStore();
    const snackbar = useSnackbarStore(); 
    try {
        ui.view2Show.isBusy = true;
        const response = await apiCall();

        if (response?.error) {
            throw response.error;
        }

        if (successMessage) {
            snackbar.trigger({ message: successMessage, color: 'success' });
        }
        // Return the data if it exists, otherwise the default
        return response || defaultValue; 
        
    } catch (e) {
        console.log(e.response?.status, e.response?.data);
        snackbar.trigger({ message: e.response?.data, color: 'error' });
        let errorMsg;
        if (e.code === 'ECONNABORTED') {
            errorMsg = 'Request timed out';
        } else if (!e.response) {
            errorMsg = 'Network error — cannot reach server';
        } else {
            const data = e.response.data;
            let raw;
            if (typeof data === 'string' && data) {
                raw = data;                          // plain text body
            } else if (data && typeof data === 'object') {
                raw = data.message || data.error || JSON.stringify(data);  // JSON body
            } else {
                raw = e.message;                     // fallback: "Request failed with status code 500"
            }
            errorMsg = raw.split(';')[0] || 'Server Error';
        }
        if (rethrow) throw e;
        return defaultValue;
    } finally {
        ui.view2Show.isBusy = false;
    }
}
