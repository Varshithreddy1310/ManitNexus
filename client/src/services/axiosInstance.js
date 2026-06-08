import axios from 'axios';

const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

const axiosInstance = axios.create({
  baseURL,
  timeout: 90000, // 90s — AI endpoint (OpenRouter free tier) can take 15-40s
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor to attach JWT token
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('manit_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle standard response envelopes and global errors
axiosInstance.interceptors.response.use(
  (response) => {
    return response.data; // automatically unpack standard envelop { success, data, message }
  },
  (error) => {
    // If unauthorized (token expired / invalid), clean local storage
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('manit_token');
    }
    
    // Provide a normalized error structure for frontend consumption
    const isTimeout = error.code === 'ECONNABORTED' || error.code === 'ERR_NETWORK';
    const parsedError = {
      message: isTimeout
        ? 'The AI took too long to respond. Please try again.'
        : (error.response?.data?.message || 'Something went wrong'),
      status: isTimeout ? 504 : (error.response?.status || 500),
      data: error.response?.data?.data || null
    };
    
    return Promise.reject(parsedError);
  }
);

export default axiosInstance;
