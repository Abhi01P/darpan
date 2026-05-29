import { create } from 'zustand';

interface UIState {
  currentView: string;
  setCurrentView: (view: string) => void;
  pendingTryOn: { title: string; image_url: string; source_url?: string } | null;
  setPendingTryOn: (item: { title: string; image_url: string; source_url?: string } | null) => void;
}

export const useUIStore = create<UIState>((set) => ({
  currentView: 'fitting-room',
  setCurrentView: (view) => set({ currentView: view }),
  pendingTryOn: null,
  setPendingTryOn: (item) => set({ pendingTryOn: item }),
}));
