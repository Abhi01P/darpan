import { create } from "zustand";
import { api } from "@/services/api";
import axios from "axios";

export interface PriceComparison {
  retailer: string;
  price: number;
  url: string;
}

export interface WardrobeItem {
  item_id: string;
  title: string;
  image_url: string;
  source_url?: string;
  price_comparisons?: PriceComparison[];
  added_at: string;
}

interface WardrobeState {
  items: WardrobeItem[];
  isLoading: boolean;
  error: string | null;
  
  fetchWardrobe: () => Promise<void>;
  addByUrl: (url: string) => Promise<WardrobeItem | null>;
  removeItem: (itemId: string) => Promise<boolean>;
}

export const useWardrobeStore = create<WardrobeState>((set) => ({
  items: [],
  isLoading: false,
  error: null,

  fetchWardrobe: async () => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.get("/platform/wardrobe");
      set({ items: res.data.items, isLoading: false });
    } catch (err: unknown) {
      let message = "Failed to fetch wardrobe.";
      if (axios.isAxiosError(err)) {
        message = err.response?.data?.detail || err.message;
      } else if (err instanceof Error) {
        message = err.message;
      }
      set({ 
        error: message, 
        isLoading: false 
      });
    }
  },

  addByUrl: async (url: string) => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.post("/platform/wardrobe/add-by-url", { url });
      const newItem: WardrobeItem = res.data;
      
      // Update local state grid
      set((state) => ({
        items: [newItem, ...state.items],
        isLoading: false
      }));
      return newItem;
    } catch (err: unknown) {
      let message = "Could not extract or save item from URL.";
      if (axios.isAxiosError(err)) {
        message = err.response?.data?.detail || err.message;
      } else if (err instanceof Error) {
        message = err.message;
      }
      set({ 
        error: message, 
        isLoading: false 
      });
      return null;
    }
  },

  removeItem: async (itemId: string) => {
    try {
      await api.delete(`/platform/wardrobe/${itemId}`);
      set((state) => ({
        items: state.items.filter((item) => item.item_id !== itemId)
      }));
      return true;
    } catch (err: unknown) {
      console.error("Failed to delete item:", err);
      return false;
    }
  }
}));
