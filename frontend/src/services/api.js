import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const getTransactions = async (userId) => {
  const response = await api.get(`/transactions/${userId}`);
  return response.data;
};

export const addTransaction = async (data) => {
  const response = await api.post('/transactions', data);
  return response.data;
};

export const deleteTransaction = async (id) => {
  const response = await api.delete(`/transactions/${id}`);
  return response.data;
};

export const getSummary = async (userId) => {
  const response = await api.get(`/summary/${userId}`);
  return response.data;
};

export const getInsights = async (userId) => {
  const response = await api.get(`/insights/${userId}`);
  return response.data;
};

export const getPrediction = async (userId) => {
  const response = await api.get(`/predict/${userId}`);
  return response.data;
};

export const getCategories = async () => {
  const response = await api.get(`/categories`);
  return response.data;
};

// ── Authentication ───────────────────────────────────────────────────────────
export const registerUser = async (data) => {
  const response = await api.post('/auth/register', data);
  return response.data;
};

export const loginUser = async (data) => {
  const response = await api.post('/auth/login', data);
  return response.data;
};

export const resetPassword = async (data) => {
  const response = await api.post('/auth/reset-password', data);
  return response.data;
};

export const sendOtp = async (data) => {
  const response = await api.post('/auth/send-otp', data);
  return response.data;
};

export const verifyLogin = async (data) => {
  const response = await api.post('/auth/verify-login', data);
  return response.data;
};

export const resendOtp = async (data) => {
  const response = await api.post('/auth/resend-otp', data);
  return response.data;
};
