import { create } from 'zustand';
import { api } from '@/services/api';
import axios from 'axios';

export interface PriceComparison {
  retailer: string;
  price: number | null;
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
      const res = await api.get('/platform/wardrobe');
      set({ items: res.data.items, isLoading: false });
    } catch (err: unknown) {
      let msg = 'Failed to fetch wardrobe.';
      if (axios.isAxiosError(err)) msg = err.response?.data?.detail || err.message;
      set({ error: msg, isLoading: false });
    }
  },

  addByUrl: async (url) => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.post('/platform/wardrobe/add-by-url', { url });
      const item: WardrobeItem = res.data;
      set((s) => ({ items: [item, ...s.items], isLoading: false }));
      return item;
    } catch (err: unknown) {
      let msg = 'Could not extract item from URL.';
      if (axios.isAxiosError(err)) msg = err.response?.data?.detail || err.message;
      set({ error: msg, isLoading: false });
      return null;
    }
  },

  removeItem: async (itemId) => {
    try {
      await api.delete(`/platform/wardrobe/${itemId}`);
      set((s) => ({ items: s.items.filter((i) => i.item_id !== itemId) }));
      return true;
    } catch {
      return false;
    }
  },
}));
