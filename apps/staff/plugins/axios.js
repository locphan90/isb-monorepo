//plugins/axios.js
import axios from "axios";
import { SQLAPI } from '~/utils/globals'

export default defineNuxtPlugin((nuxtApp) => {
  const instance = axios.create({
    baseURL: SQLAPI
  });

  // Request interceptor
  instance.interceptors.request.use((config) => {
    const token = useCookie("wsu_auth_token").value; // read token from cookie
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  // Response interceptor (optional: handle global errors)
  instance.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response?.status === 401) {
        console.error("Unauthorized, maybe redirect to login?");
      }
      return Promise.reject(error);
    }
  );

  // Provide globally
  return {
    provide: {
      axios: instance,
    },
  };
});