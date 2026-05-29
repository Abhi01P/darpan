import { create } from "zustand";
import { api } from "@/services/api";
import axios from "axios";

export interface MeshResult {
  status: string;
  mesh_url: string;
  measurements: {
    chest: number;
    waist: number;
    inseam: number;
  };
  original_image: string;
}

export interface TryOnResult {
  status: string;
  result_image_url: string;
  person_image: string;
  garment_image: string;
}

interface TryOnProgress {
  meshTaskId: string | null;
  meshStatus: "IDLE" | "PROCESSING" | "SUCCESS" | "FAILURE";
  meshResult: MeshResult | null;

  tryonTaskId: string | null;
  tryonStatus: "IDLE" | "PROCESSING" | "SUCCESS" | "FAILURE";
  tryonResult: TryOnResult | null;
}

interface DigitalTwinState {
  progress: TryOnProgress;
  stylingAdvice: string | null;
  recommendedGarmentId: string | null;
  recommendedGarmentImageUrl: string | null;
  extractedTitle: string | null;
  isLoading: boolean;
  error: string | null;
  poseLandmarks: { x: number; y: number; z: number; visibility?: number }[] | null;
  chatHistory: { role: "user" | "assistant"; content: string }[];
  dislikedItems: string[];

  // Track active polling intervals so we can clean them up
  _activePollers: ReturnType<typeof setInterval>[];

  startTryOnWorkflow: (payload: {
    user_image_url: string;
    garment_image_url?: string;
    garment_page_url?: string;
    user_query?: string;
  }) => Promise<void>;
  
  pollTaskStatus: (taskId: string, type: "mesh" | "tryon") => void;
  setPoseLandmarks: (landmarks: { x: number; y: number; z: number; visibility?: number }[] | null) => void;
  appendChatMessage: (role: "user" | "assistant", content: string) => void;
  swipeGarment: (itemId: string, action: "like" | "dislike") => Promise<void>;
  cleanup: () => void;
}

export const useDigitalTwinStore = create<DigitalTwinState>((set, get) => ({
  progress: {
    meshTaskId: null,
    meshStatus: "IDLE",
    meshResult: null,
    tryonTaskId: null,
    tryonStatus: "IDLE",
    tryonResult: null,
  },
  stylingAdvice: null,
  recommendedGarmentId: null,
  recommendedGarmentImageUrl: null,
  extractedTitle: null,
  isLoading: false,
  error: null,
  poseLandmarks: null,
  chatHistory: [],
  dislikedItems: [],
  _activePollers: [],

  setPoseLandmarks: (landmarks) => set({ poseLandmarks: landmarks }),

  appendChatMessage: (role, content) => set((state) => ({
    chatHistory: [...state.chatHistory, { role, content }]
  })),

  cleanup: () => {
    // Clear all active polling intervals to prevent memory leaks
    const pollers = get()._activePollers;
    pollers.forEach((id) => clearInterval(id));
    set({ _activePollers: [] });
  },

  swipeGarment: async (itemId, action) => {
    try {
      await api.post("/platform/swipe", { item_id: itemId, action });
      if (action === "dislike") {
        set((state) => ({
          dislikedItems: [...state.dislikedItems, itemId],
          recommendedGarmentId: null,
        }));
      }
    } catch (err) {
      console.error("Failed to register swipe:", err);
    }
  },

  startTryOnWorkflow: async (payload) => {
    // Clean up any previous polling loops before starting a new workflow
    get().cleanup();

    set({ isLoading: true, error: null });
    try {
      if (payload.user_query) {
        get().appendChatMessage("user", payload.user_query);
      }

      let currentDislikes = get().dislikedItems;
      if (currentDislikes.length === 0) {
          try {
              const dlRes = await api.get("/platform/wardrobe/dislikes");
              currentDislikes = dlRes.data;
              set({ dislikedItems: currentDislikes });
          } catch {
              // Fail silently on fetching dislikes
          }
      }

      const backendPayload = {
        ...payload,
        chat_history: get().chatHistory,
        disliked_items: currentDislikes
      };

      const res = await api.post("/try-on/process", backendPayload);
      const data = res.data;

      set({
        progress: {
          meshTaskId: data.mesh_task_id || null,
          meshStatus: data.mesh_task_id ? "PROCESSING" : "IDLE",
          meshResult: null,
          tryonTaskId: data.tryon_task_id || null,
          tryonStatus: data.tryon_task_id ? "PROCESSING" : "IDLE",
          tryonResult: null,
        },
        stylingAdvice: data.styling_advice || null,
        recommendedGarmentId: data.recommended_garment_id || null,
        recommendedGarmentImageUrl: data.recommended_garment_image_url || null,
        extractedTitle: data.extracted_garment_title || null,
        isLoading: false,
      });

      if (data.styling_advice) {
          get().appendChatMessage("assistant", data.styling_advice);
      }

      if (data.mesh_task_id) {
        get().pollTaskStatus(data.mesh_task_id, "mesh");
      }
      if (data.tryon_task_id) {
        get().pollTaskStatus(data.tryon_task_id, "tryon");
      }

    } catch (err: unknown) {
      let message = "Failed to trigger try-on workflow.";
      if (axios.isAxiosError(err)) {
        message = err.response?.data?.detail || err.message;
      } else if (err instanceof Error) {
        message = err.message;
      }
      set({
        error: message,
        isLoading: false,
      });
    }
  },

  pollTaskStatus: (taskId, type) => {
    const interval = setInterval(async () => {
      try {
        const res = await api.get(`/try-on/tasks/${taskId}`);
        const { status, result } = res.data;

        if (status === "SUCCESS") {
          clearInterval(interval);
          set((state) => ({
            _activePollers: state._activePollers.filter((id) => id !== interval),
            progress: {
              ...state.progress,
              [type === "mesh" ? "meshStatus" : "tryonStatus"]: "SUCCESS",
              [type === "mesh" ? "meshResult" : "tryonResult"]: result,
            },
          }));
        } else if (status === "FAILURE") {
          clearInterval(interval);
          set((state) => ({
            _activePollers: state._activePollers.filter((id) => id !== interval),
            progress: {
              ...state.progress,
              [type === "mesh" ? "meshStatus" : "tryonStatus"]: "FAILURE",
            },
          }));
        }
      } catch (err) {
        console.error(`Error polling task ${taskId}:`, err);
        clearInterval(interval);
        set((state) => ({
          _activePollers: state._activePollers.filter((id) => id !== interval),
        }));
      }
    }, 2000);

    // Track the interval so cleanup() can clear it on unmount
    set((state) => ({
      _activePollers: [...state._activePollers, interval],
    }));
  },
}));
