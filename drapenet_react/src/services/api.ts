import axios from 'axios';

// Use the environment variable if defined (for Vercel), otherwise fallback to local development URL
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

export const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
  // Fail loudly instead of hanging forever if a response stalls (e.g. through the devtunnel)
  timeout: 60000,
});

// Attach JWT token to every outbound request if one exists
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('drapenet_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
