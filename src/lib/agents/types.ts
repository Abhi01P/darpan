// ─── Agent Pipeline Types ───────────────────────────────────
// TypeScript port of DrapeNet's AgentState — the shared state
// object passed between Gatekeeper → Stylist → Artist agents.

export interface AgentState {
  // ─── User Inputs ─────────────────────────────────────────
  userImageUrl: string | null;
  garmentImageUrl: string | null;
  garmentPageUrl: string | null;
  userGender: "male" | "female" | "non-binary" | null;
  chatHistory: ChatHistoryMessage[];
  dislikedItems: string[];

  // ─── Internal State ──────────────────────────────────────
  imageType: "full_body" | "garment" | "invalid" | "unknown";
  validationMessage: string;
  garmentTitle: string | null;

  // ─── Stylist Outputs ─────────────────────────────────────
  intentType: "GREETING" | "CLARIFY" | "SEARCH" | "TRYON_SPECIFIC" | null;
  recommendedGarmentId: string | null;
  recommendedItems: RecommendedItem[];
  stylingAdvice: string;

  // ─── Artist Outputs ──────────────────────────────────────
  tryOnTaskId: string | null;
  finalOutputUrl: string | null;

  // ─── Workflow Control ────────────────────────────────────
  currentAgent: string;
  error: string | null;
}

export interface ChatHistoryMessage {
  role: "user" | "assistant";
  content: string;
}

export interface RecommendedItem {
  itemId: string;
  title: string;
  imageUrl: string;
  pageContent?: string;
  price?: string | number | Float32Array | null;
  rating?: string | number | Float32Array | null;
}

// ─── Pipeline Result ────────────────────────────────────────
// What the workflow returns to the API route after all agents run.

export interface PipelineResult {
  reply: string;
  intentType: AgentState["intentType"];
  recommendedItems: RecommendedItem[];
  tryOnResultUrl: string | null;
  error: string | null;
}

export function createInitialState(
  overrides: Partial<AgentState> = {}
): AgentState {
  return {
    userImageUrl: null,
    garmentImageUrl: null,
    garmentPageUrl: null,
    userGender: null,
    chatHistory: [],
    dislikedItems: [],
    imageType: "unknown",
    validationMessage: "",
    garmentTitle: null,
    intentType: null,
    recommendedGarmentId: null,
    recommendedItems: [],
    stylingAdvice: "",
    tryOnTaskId: null,
    finalOutputUrl: null,
    currentAgent: "",
    error: null,
    ...overrides,
  };
}
