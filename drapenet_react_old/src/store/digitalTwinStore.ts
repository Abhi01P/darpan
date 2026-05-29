import { create } from 'zustand';
import { api } from '@/services/api';
import axios from 'axios';

interface TryOnProgress {
  meshTaskId: string | null;
  meshStatus: 'IDLE' | 'PROCESSING' | 'SUCCESS' | 'FAILURE';
  tryonTaskId: string | null;
  tryonStatus: 'IDLE' | 'PROCESSING' | 'SUCCESS' | 'FAILURE';
  tryonResult: { result_image_url: string } | null;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface RecommendedItem {
  item_id: string;
  title: string;
  image_url: string;
}

interface DigitalTwinState {
  progress: TryOnProgress;
  stylingAdvice: string | null;
  recommendedItems: RecommendedItem[];
  currentCardIndex: number;
  isLoading: boolean;
  error: string | null;
  chatHistory: ChatMessage[];
  dislikedItems: string[];
  _pollers: ReturnType<typeof setInterval>[];

  startWorkflow: (payload: {
    user_image_url: string;
    garment_image_url?: string;
    user_query?: string;
    user_gender?: string;
  }) => Promise<void>;
  pollTask: (taskId: string, type: 'mesh' | 'tryon') => void;
  appendChat: (role: 'user' | 'assistant', content: string) => void;
  swipeCard: (action: 'like' | 'dislike') => Promise<void>;
  cleanup: () => void;
}

export const useDigitalTwinStore = create<DigitalTwinState>((set, get) => ({
  progress: {
    meshTaskId: null, meshStatus: 'IDLE',
    tryonTaskId: null, tryonStatus: 'IDLE', tryonResult: null,
  },
  stylingAdvice: null,
  recommendedItems: [],
  currentCardIndex: 0,
  isLoading: false,
  error: null,
  chatHistory: [],
  dislikedItems: [],
  _pollers: [],

  appendChat: (role, content) =>
    set((s) => ({ chatHistory: [...s.chatHistory, { role, content }] })),

  cleanup: () => {
    get()._pollers.forEach(clearInterval);
    set({ _pollers: [] });
  },

  swipeCard: async (action) => {
    const { recommendedItems, currentCardIndex } = get();
    const item = recommendedItems[currentCardIndex];
    if (!item) return;

    try {
      await api.post('/platform/swipe', {
        item_id: item.item_id,
        action,
        title: item.title,
        image_url: item.image_url,
      });
    } catch (err) {
      console.error('Swipe failed:', err);
    }

    if (action === 'dislike') {
      set((s) => ({ dislikedItems: [...s.dislikedItems, item.item_id] }));
    }

    // Advance to the next card
    const nextIndex = currentCardIndex + 1;
    set({ currentCardIndex: nextIndex });
  },

  startWorkflow: async (payload) => {
    get().cleanup();
    set({ isLoading: true, error: null, recommendedItems: [], currentCardIndex: 0 });

    try {
      if (payload.user_query) get().appendChat('user', payload.user_query);

      let dislikes = get().dislikedItems;
      if (dislikes.length === 0) {
        try {
          const r = await api.get('/platform/wardrobe/dislikes');
          dislikes = r.data;
          set({ dislikedItems: dislikes });
        } catch { /* ignore */ }
      }

      const res = await api.post('/try-on/process', {
        ...payload,
        chat_history: get().chatHistory,
        disliked_items: dislikes,
      });
      const d = res.data;

      set({
        progress: {
          meshTaskId: d.mesh_task_id || null,
          meshStatus: d.mesh_task_id ? 'PROCESSING' : 'IDLE',
          tryonTaskId: d.tryon_task_id || null,
          tryonStatus: d.tryon_task_id ? 'PROCESSING' : 'IDLE',
          tryonResult: null,
        },
        stylingAdvice: d.styling_advice || null,
        recommendedItems: d.recommended_items || [],
        currentCardIndex: 0,
        isLoading: false,
      });

      if (d.styling_advice) get().appendChat('assistant', d.styling_advice);
      if (d.mesh_task_id) get().pollTask(d.mesh_task_id, 'mesh');
      if (d.tryon_task_id) get().pollTask(d.tryon_task_id, 'tryon');
    } catch (err: unknown) {
      let msg = 'Workflow failed.';
      if (axios.isAxiosError(err)) msg = err.response?.data?.detail || err.message;
      set({ error: msg, isLoading: false });
    }
  },

  pollTask: (taskId, type) => {
    const iv = setInterval(async () => {
      try {
        const r = await api.get(`/try-on/tasks/${taskId}`);
        if (r.data.status === 'SUCCESS') {
          clearInterval(iv);
          set((s) => ({
            _pollers: s._pollers.filter((p) => p !== iv),
            progress: {
              ...s.progress,
              [type === 'mesh' ? 'meshStatus' : 'tryonStatus']: 'SUCCESS',
              ...(type === 'tryon' ? { tryonResult: r.data.result } : {}),
            },
          }));
        } else if (r.data.status === 'FAILURE') {
          clearInterval(iv);
          set((s) => ({
            _pollers: s._pollers.filter((p) => p !== iv),
            progress: {
              ...s.progress,
              [type === 'mesh' ? 'meshStatus' : 'tryonStatus']: 'FAILURE',
            },
          }));
        }
      } catch {
        clearInterval(iv);
      }
    }, 2000);
    set((s) => ({ _pollers: [...s._pollers, iv] }));
  },
}));
