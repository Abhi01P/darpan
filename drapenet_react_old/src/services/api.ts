import axios from 'axios';

const API_BASE = 'http://localhost:8000/api/v1';

export const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT token to every outbound request if one exists
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('drapenet_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
