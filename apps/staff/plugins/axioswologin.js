import axios from "axios";

export default defineNuxtPlugin((nuxtApp) => {
  const config = useRuntimeConfig();
  const instance = axios.create(); 
  instance.interceptors.request.use((requestConfig) => {
    requestConfig.headers['x-internal-service-key'] = config.public.internalServiceKey  
    return requestConfig;
  });

  instance.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response?.status === 401) {
        console.error("Unauthorized, maybe redirect to login?");
      }
      return Promise.reject(error);
    }
  );
  return {
    provide: {
      axioswologin: instance,
    },
  };
});





  

  
  