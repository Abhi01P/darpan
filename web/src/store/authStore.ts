import { create } from "zustand";
import { api } from "@/services/api";
import axios from "axios";

interface User {
  id: string;
  email: string;
  name: string;
  digital_twin?: {
    avatar_mesh_url?: string | null;
    measurements?: {
      chest?: number;
      waist?: number;
      inseam?: number;
    } | null;
  } | null;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
  
  initialize: () => Promise<void>;
  login: (form: FormData) => Promise<boolean>;
  signup: (payload: Record<string, string>) => Promise<boolean>;
  logout: () => void;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  isLoading: false,
  error: null,

  initialize: async () => {
    if (typeof window === "undefined") return;
    const token = localStorage.getItem("token");
    if (!token) return;

    set({ token, isLoading: true });
    try {
      const res = await api.get("/auth/me");
      set({ user: res.data, isLoading: false });
    } catch (err: unknown) {
      console.error("Auth init failed, logging out:", err);
      get().logout();
    }
  },

  login: async (formData: FormData) => {
    set({ isLoading: true, error: null });
    try {
      // FastAPI OAuth2PasswordRequestForm expects strict URL encoded parameters
      const params = new URLSearchParams();
      params.append("username", formData.get("username") as string);
      params.append("password", formData.get("password") as string);

      const res = await api.post("/auth/login", params, {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      });
      const token = res.data.access_token;
      localStorage.setItem("token", token);
      set({ token });
      
      // Fetch user profile immediately
      const userRes = await api.get("/auth/me");
      set({ user: userRes.data, isLoading: false });
      return true;
    } catch (err: unknown) {
      let message = "Invalid login credentials";
      if (axios.isAxiosError(err)) {
        message = err.response?.data?.detail || err.message;
      } else if (err instanceof Error) {
        message = err.message;
      }
      set({ 
        error: message, 
        isLoading: false 
      });
      return false;
    }
  },

  signup: async (payload) => {
    set({ isLoading: true, error: null });
    try {
      await api.post("/auth/signup", payload);
      // Automatically login after signup
      const formData = new FormData();
      formData.append("username", payload.email);
      formData.append("password", payload.password);
      return await get().login(formData);
    } catch (err: unknown) {
      let message = "Signup failed.";
      if (axios.isAxiosError(err)) {
        message = err.response?.data?.detail || err.message;
      } else if (err instanceof Error) {
        message = err.message;
      }
      set({ 
        error: message, 
        isLoading: false 
      });
      return false;
    }
  },

  logout: () => {
    localStorage.removeItem("token");
    set({ user: null, token: null, error: null });
  },

  clearError: () => set({ error: null }),
}));
