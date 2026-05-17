// ─── AI Chat Types ──────────────────────────────────────────
// Shared types for the AI Chat feature.
// Used by both the frontend client and backend API routes.

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  productData?: ProductAnalysis | null;
  suggestedActions?: SuggestedAction[];
}

export interface ProductAnalysis {
  name: string;
  brand: string;
  price: string;
  material: string;
  styleCategory: string;
  sizingInfo: string;
  imageUrl: string;
  sourceUrl: string;
  description: string;
  colors: string[];
  occasions: string[];
}

export interface ChatContext {
  wardrobeItems?: WardrobeItem[];
  productUrl?: string;
}

export interface WardrobeItem {
  id: number;
  name: string;
  tag: string;
  price: string;
  image_url: string;
  desc?: string;
}

export interface AIResponse {
  reply: string;
  productData?: ProductAnalysis | null;
  suggestedActions?: SuggestedAction[];
}

export interface SuggestedAction {
  label: string;
  type: "try-on" | "add-wardrobe" | "view-similar";
  payload: Record<string, string>;
}

// ─── API Request / Response shapes ──────────────────────────

export interface ChatAPIRequest {
  messages: { role: "user" | "assistant"; content: string }[];
  context?: ChatContext;
}

export interface ChatAPIResponse {
  reply: string;
  productData?: ProductAnalysis | null;
  suggestedActions?: SuggestedAction[];
  error?: string;
}

export interface AnalyzeURLRequest {
  url: string;
}

export interface AnalyzeURLResponse {
  productData: ProductAnalysis;
  error?: string;
}
