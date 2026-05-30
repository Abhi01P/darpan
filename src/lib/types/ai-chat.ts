// ─── AI Chat Types ──────────────────────────────────────────
// Shared types for the AI Chat feature.
// Used by both the frontend client and backend API routes.
// Updated for the DrapeNet 3-agent pipeline.

// ─── Price Comparison (from Google Lens) ────────────────────

export interface PriceComparison {
  retailer: string;
  price: number | null;
  url: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  productData?: ProductAnalysis | null;
  suggestedActions?: SuggestedAction[];
  recommendedItems?: RecommendedItemData[];
  tryOnResultUrl?: string | null;
  intentType?: string | null;
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
  priceComparisons?: PriceComparison[];
}

export interface ChatContext {
  wardrobeItems?: WardrobeItem[];
  productUrl?: string;
  userImageUrl?: string;
  garmentImageUrl?: string;
  garmentPageUrl?: string;
  userGender?: "male" | "female" | "non-binary";
}

export interface WardrobeItem {
  id: number;
  name: string;
  tag: string;
  price: string;
  image_url: string;
  desc?: string;
  rating?: number;
}

export interface RecommendedItemData {
  itemId: string;
  title: string;
  imageUrl: string;
  price?: number;
  rating?: number;
}

export interface AIResponse {
  reply: string;
  productData?: ProductAnalysis | null;
  suggestedActions?: SuggestedAction[];
  recommendedItems?: RecommendedItemData[];
  tryOnResultUrl?: string | null;
  intentType?: string | null;
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
  recommendedItems?: RecommendedItemData[];
  tryOnResultUrl?: string | null;
  intentType?: string | null;
  priceComparisons?: PriceComparison[];
  error?: string;
}

export interface AnalyzeURLRequest {
  url: string;
}

export interface AnalyzeURLResponse {
  productData: ProductAnalysis;
  error?: string;
}
