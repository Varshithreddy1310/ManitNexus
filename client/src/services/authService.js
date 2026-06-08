import axiosInstance from './axiosInstance';

export const registerUser = async (name, email, password) => {
  return axiosInstance.post('/api/auth/register', { name, email, password });
};

export const loginUser = async (email, password) => {
  return axiosInstance.post('/api/auth/login', { email, password });
};

export const adminLoginUser = async (email, passkey) => {
  return axiosInstance.post('/api/admin/login', { email, passkey });
};

export const getMe = async () => {
  return axiosInstance.get('/api/auth/me');
};
