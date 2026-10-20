// utils/apiWapper_getFunc.js (or directApi.js)

function getDirectToken() {
    if (typeof document === 'undefined') return ''; 
    const value = `; ${document.cookie}`;
    const parts = value.split(`; wsu_auth_token=`);
    if (parts.length === 2) {
        const rawToken = parts.pop()?.split(';').shift() || '';
        return decodeURIComponent(rawToken).replace(/^"|"$/g, '');
    }
    return '';
}

export async function useDirectApi(funcName, params = [], orderBy) {
    const ui = useUIStore();
    const snackbar = useSnackbarStore();

    try {
        ui.view2Show.isBusy = true;
        const token = getDirectToken();
        
        let url = `https://mywsu.vn:2096/API/selectdata?funcName=${funcName}`;
        
        if (orderBy) {
            url += `&orderBy=${encodeURIComponent(orderBy)}`;
        }
        const paramArray = Array.isArray(params) ? params : [params];
        paramArray.forEach((param, index) => {
            if (param !== undefined && param !== null) {
                const serializedValue = typeof param === 'object' ? JSON.stringify(param) : param;
                url += `&para${index + 1}=${encodeURIComponent(serializedValue)}`;
            }
        });

        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText || `Server returned status ${response.status}`);
        }

        const data = await response.json();
        return Array.isArray(data) ? data : (data.result || []);

    } catch (error) {
        console.error(`[useDirectApi Error - ${funcName}]:`, error.message || error);
        snackbar.trigger({ message: error.message || 'API request failed', color: 'error' });
        return []; 
    } finally {
        ui.view2Show.isBusy = false;
    }
}