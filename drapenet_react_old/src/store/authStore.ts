import { create } from 'zustand';
import { api } from '@/services/api';
import axios from 'axios';

interface User {
  email: string;
  name: string;
  gender: string | null;
}

interface AuthState {
  user: User | null;
  isLoading: boolean;
  error: string | null;

  initialize: () => Promise<void>;
  login: (email: string, password: string) => Promise<boolean>;
  register: (name: string, email: string, password: string, gender: string) => Promise<boolean>;
  logout: () => void;
}

/**
 * Safely extracts a human-readable error string from an Axios error.
 * FastAPI 422 errors return `detail` as an array of objects, not a string,
 * which would crash React if rendered directly in JSX.
 */
function extractErrorMessage(err: unknown, fallback: string): string {
  if (!axios.isAxiosError(err)) return fallback;
  const detail = err.response?.data?.detail;
  if (!detail) return err.message || fallback;

  // FastAPI validation errors: detail is [{msg: "...", loc: [...], ...}]
  if (Array.isArray(detail)) {
    return detail.map((d: { msg?: string }) => d.msg || '').join('. ') || fallback;
  }

  // Normal error: detail is a string
  if (typeof detail === 'string') return detail;

  return fallback;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: false,
  error: null,

  initialize: async () => {
    const token = localStorage.getItem('drapenet_token');
    if (!token) {
      set({ user: null, isLoading: false });
      return;
    }
    set({ isLoading: true });
    try {
      const res = await api.get('/auth/me');
      set({ user: { email: res.data.email, name: res.data.name, gender: res.data.gender || null }, isLoading: false });
    } catch {
      localStorage.removeItem('drapenet_token');
      set({ user: null, isLoading: false });
    }
  },

  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      // Backend uses OAuth2PasswordRequestForm which expects form-urlencoded
      // with fields "username" (mapped to email) and "password"
      const formData = new URLSearchParams();
      formData.append('username', email);
      formData.append('password', password);

      const res = await api.post('/auth/login', formData, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      });

      localStorage.setItem('drapenet_token', res.data.access_token);

      // Login response is just {access_token, token_type} — no user object.
      // Fetch the user profile separately.
      const meRes = await api.get('/auth/me');
      set({ user: { email: meRes.data.email, name: meRes.data.name, gender: meRes.data.gender || null }, isLoading: false });
      return true;
    } catch (err: unknown) {
      set({ error: extractErrorMessage(err, 'Login failed.'), isLoading: false });
      return false;
    }
  },

  register: async (name, email, password, gender) => {
    set({ isLoading: true, error: null });
    try {
      // Backend endpoint is /signup, not /register
      await api.post('/auth/signup', { name, email, password, gender });

      // Signup doesn't return a token — log in immediately after
      const formData = new URLSearchParams();
      formData.append('username', email);
      formData.append('password', password);

      const loginRes = await api.post('/auth/login', formData, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      });

      localStorage.setItem('drapenet_token', loginRes.data.access_token);

      const meRes = await api.get('/auth/me');
      set({ user: { email: meRes.data.email, name: meRes.data.name, gender: meRes.data.gender || null }, isLoading: false });
      return true;
    } catch (err: unknown) {
      set({ error: extractErrorMessage(err, 'Registration failed.'), isLoading: false });
      return false;
    }
  },

  logout: () => {
    localStorage.removeItem('drapenet_token');
    set({ user: null, error: null });
  },
}));
