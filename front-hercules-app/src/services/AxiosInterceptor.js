import axios from 'axios';
import API_BASE from '@/helpers/apiBase';

const axiosInstance = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

axiosInstance.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token =
        localStorage.getItem('token') ||
        localStorage.getItem('auth_token') ||
        sessionStorage.getItem('token') ||
        sessionStorage.getItem('auth_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }

    return config;
  },
  (error) => Promise.reject(error)
);

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_role');
      localStorage.removeItem('auth_user');
      sessionStorage.removeItem('token');
      sessionStorage.removeItem('auth_token');
      sessionStorage.removeItem('auth_role');
      sessionStorage.removeItem('auth_user');
      document.cookie = 'auth_token=; Path=/; Max-Age=0; SameSite=Lax';
      document.cookie = 'auth_role=; Path=/; Max-Age=0; SameSite=Lax';
      window.location.href = '/login';
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
