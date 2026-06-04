// ─── Stylist Agent ──────────────────────────────────────────
// TypeScript port of DrapeNet's stylist.py
// Intent detection via Gemini, conversational styling,
// and live web product search.
// Falls back to keyword-based mock when GEMINI_API_KEY is absent.

import { GoogleGenerativeAI } from "@google/generative-ai";
import type { AgentState } from "./types";
import { searchLiveRetailer } from "../scraper";

const GEMINI_MODEL = "gemini-3-flash-preview";

function hasGeminiKey(): boolean {
  return Boolean(process.env.GEMINI_API_KEY);
}

function getGeminiClient(): GoogleGenerativeAI {
  return new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
}

/**
 * Builds a transcript string from chat history for Gemini context.
 */
function buildTranscript(
  chatHistory: { role: string; content: string }[]
): string {
  return chatHistory
    .map((msg) => {
      const role = msg.role === "user" ? "User" : "Stylist";
      return `${role}: ${msg.content}`;
    })
    .join("\n");
}

// ─── Mock Intent Detection ──────────────────────────────────
// Keyword-based fallback when no Gemini API key is available.

const GREETING_WORDS = new Set([
  "hi", "hello", "hey", "howdy", "sup", "yo", "hola", "greetings",
  "good morning", "good afternoon", "good evening", "what's up",
  "how are you", "help",
]);

const SEARCH_KEYWORDS = [
  "shirt", "t-shirt", "tshirt", "polo", "jacket", "hoodie", "sweater",
  "jeans", "pants", "trousers", "shorts", "dress", "skirt", "blazer",
  "coat", "kurta", "saree", "lehenga", "suit", "chinos", "joggers",
  "sneakers", "shoes", "boots", "sandals", "watch", "cap", "hat",
  "bag", "backpack", "sunglasses", "formal", "casual", "party",
  "blue", "black", "white", "red", "green", "pink", "yellow",
  "find", "search", "show", "get", "buy", "want", "looking for",
  "recommend", "suggest", "outfit", "wear", "style",
];

function detectMockIntent(query: string): "GREETING" | "CLARIFY" | "SEARCH" | "TRYON_SPECIFIC" {
  const lower = query.toLowerCase().trim();

  // Direct try-on command
  if (lower.startsWith("i want to try on this item:")) return "TRYON_SPECIFIC";

  // Pure greeting (short message with greeting words)
  const words = lower.split(/\s+/);
  if (words.length <= 5) {
    for (const word of words) {
      if (GREETING_WORDS.has(word)) return "GREETING";
    }
    // Check multi-word greetings
    for (const greeting of GREETING_WORDS) {
      if (lower.includes(greeting)) return "GREETING";
    }
  }

  // Search — has specific fashion keywords
  const matchCount = SEARCH_KEYWORDS.filter((kw) => lower.includes(kw)).length;
  if (matchCount >= 1) return "SEARCH";

  // Default to clarify if we can't determine intent
  return "CLARIFY";
}

/**
 * Extracts a search query from the user's message using keyword extraction.
 */
function extractSearchQuery(query: string, gender: string | null): string {
  const lower = query.toLowerCase();
  // Remove filler words
  const fillers = new Set([
    "i", "me", "my", "want", "to", "a", "an", "the", "please", "can",
    "you", "find", "search", "show", "get", "buy", "looking", "for",
    "some", "any", "need", "like", "would", "could", "help", "recommend",
    "suggest", "something", "that", "is", "are", "with", "in", "on",
  ]);
  const meaningful = lower
    .split(/\s+/)
    .filter((w) => !fillers.has(w) && w.length > 1)
    .join(" ");

  const prefix = gender === "female" ? "womens " : gender === "male" ? "mens " : "";
  return prefix + (meaningful || lower);
}

// ─── Mock Responses ─────────────────────────────────────────

const MOCK_GREETINGS = [
  "Hey there! 👋 I'm Darpan's AI Stylist. I can search the web for clothes, help you try them on virtually, and give you styling advice. What are you looking for today?",
  "Hello! ✨ Welcome to Darpan! I'm your personal fashion assistant. Tell me what you're shopping for — I'll search live products and you can even try them on with AI!",
  "Hi! 👗 I'm here to help you find the perfect outfit. I can search real stores, show you products, and let you virtually try on anything you like. What's your style today?",
];

const MOCK_CLARIFY = [
  "I'd love to help! Could you tell me a bit more about what you're looking for? For example, what type of clothing (shirt, jacket, dress) and any preferred color or occasion? 🤔",
  "Sure thing! To find the best options for you, could you share what kind of item you need and the occasion? For example: 'casual blue shirt' or 'formal black blazer' ✨",
  "Great, I'm on it! Just a couple quick questions — what type of garment are you after, and do you have a color or style preference? That'll help me search more accurately! 🎨",
];

/**
 * Stylist Agent — the brain of the pipeline.
 *
 * When GEMINI_API_KEY is set: Uses Gemini for intent detection + chat.
 * When not set: Uses keyword-based intent detection + template responses.
 * Live web search (scraper) works in both modes.
 */
export async function runStylist(state: AgentState): Promise<AgentState> {
  console.log("[Stylist] Analyzing conversation history");

  if (state.chatHistory.length === 0) {
    state.currentAgent = "stylist";
    return state;
  }

  const latestQuery =
    state.chatHistory[state.chatHistory.length - 1]?.content || "";
  console.log(`[Stylist] Latest query: ${latestQuery}`);

  const useGemini = hasGeminiKey();
  console.log(`[Stylist] Mode: ${useGemini ? "Gemini AI" : "Mock (no API key)"}`);

  try {
    let intentVal: string;

    if (useGemini) {
      // ── Gemini Intent Detection ────────────────────────
      const genai = getGeminiClient();
      const model = genai.getGenerativeModel({ model: GEMINI_MODEL });
      const transcript = buildTranscript(state.chatHistory);

      const intentPrompt = `Analyze this user message: '${latestQuery}'. 
Determine the intent: 
1. Reply 'GREETING' if it is a hello or general chat.
2. Reply 'CLARIFY' if they want clothes but haven't specified color, type, OR occasion.
3. Reply 'TRYON_SPECIFIC' if they explicitly say they want to try on a specific item they just selected (e.g. 'I want to try on this item: ...').
4. Reply 'SEARCH' if they have specified enough details to search for new clothes (like 'blue beach shirt' or 'black formal jacket').
Reply with ONLY the intent word, nothing else.`;

      const intentResult = await model.generateContent(intentPrompt);
      intentVal = intentResult.response.text().toUpperCase().trim();

      // ── Handle each intent with Gemini ─────────────────
      if (intentVal.includes("GREETING")) {
        state.intentType = "GREETING";
        const chatPrompt = `You are Darpan's expert fashion stylist AI. You are having a conversation with a user.
Conversation so far:
${transcript}

The user just greeted you. Respond warmly in 2-3 sentences.
Introduce yourself as Darpan's AI Stylist, and briefly explain that you can:
- Search the internet for specific clothes and show them live products
- Help them try on any garment virtually using AI
- Give styling advice and outfit recommendations from their wardrobe
Keep it friendly, use 1-2 relevant emojis.`;
        const response = await model.generateContent(chatPrompt);
        state.stylingAdvice = response.response.text();
        state.recommendedGarmentId = null;
      } else if (intentVal.includes("CLARIFY")) {
        state.intentType = "CLARIFY";
        const chatPrompt = `You are Darpan's expert fashion stylist AI. You are having a conversation with a user.
Conversation so far:
${transcript}

The user wants clothes, but you need more details to perform a web search.
Ask 1-2 friendly follow-up questions to determine their preferred color, fit, occasion, or exact style.
Keep it concise and conversational.`;
        const response = await model.generateContent(chatPrompt);
        state.stylingAdvice = response.response.text();
        state.recommendedGarmentId = null;
      } else if (intentVal.includes("TRYON_SPECIFIC")) {
        state.intentType = "TRYON_SPECIFIC";
        if (state.garmentImageUrl) {
          const chatPrompt = `You are Darpan's expert fashion stylist AI.
Conversation so far:
${transcript}

The user has selected a specific item to try on.
Respond with a brief, enthusiastic confirmation (1-2 sentences) that you are initiating the virtual try-on for this piece. Use an emoji.`;
          const response = await model.generateContent(chatPrompt);
          state.stylingAdvice = response.response.text();
          const itemId = state.recommendedGarmentId || `direct_${Date.now().toString(36)}`;
          const title = state.garmentTitle || latestQuery.replace("I want to try on this item: ", "").trim() || "Selected Item";
          state.recommendedItems = [{ itemId, title, imageUrl: state.garmentImageUrl }];
        } else {
          state.stylingAdvice = "I'd love to help you try that on, but I don't have the image for it. Could you share a product link or upload a garment photo?";
        }
      } else {
        // SEARCH
        state.intentType = "SEARCH";
        const gender = state.userGender || "";
        let genderHint = "";
        if (gender === "male") genderHint = "The user is male. Prefix the query with 'mens' if not already specified.";
        else if (gender === "female") genderHint = "The user is female. Prefix the query with 'womens' if not already specified.";

        const queryPrompt = `Based on this conversation:
${transcript}
${genderHint}
Generate a 3-5 word search query to find the exact clothing item the user wants on an e-commerce site (e.g. 'mens blue linen shirt'). Reply ONLY with the query, no quotes.`;
        const queryResult = await model.generateContent(queryPrompt);
        const searchString = queryResult.response.text().trim().replace(/['"]/g, "");
        console.log(`[Stylist] Search query: ${searchString}`);

        const liveItems = await searchLiveRetailer(searchString);
        if (liveItems.length > 0) {
          state.recommendedItems = liveItems;
          const first = liveItems[0];
          state.recommendedGarmentId = first.itemId;
          state.garmentImageUrl = first.imageUrl;
          state.garmentTitle = first.title;

          const advicePrompt = `You are Darpan's expert fashion stylist. You are having a conversation with a user.
Conversation so far:
${transcript}

You just searched the internet and found ${liveItems.length} matching items.
The top result is: '${first.title}'.

Tell the user you found several options for them to browse through.
Be enthusiastic but brief (2-3 sentences). Don't list all items individually.
Mention they can swipe through the options and tap "Try On" on any item they like. Use 1-2 emojis.`;
          const response = await model.generateContent(advicePrompt);
          state.stylingAdvice = response.response.text();
        } else {
          state.stylingAdvice = `I searched the web for "${searchString}" but couldn't find a match right now. Could you try describing it differently — maybe with a specific color, brand, or occasion?`;
          state.recommendedGarmentId = null;
          state.recommendedItems = [];
        }
      }
    } else {
      // ── MOCK MODE (no API key) ─────────────────────────
      intentVal = detectMockIntent(latestQuery);
      console.log(`[Stylist] Mock intent: ${intentVal}`);

      if (intentVal === "GREETING") {
        state.intentType = "GREETING";
        state.stylingAdvice = MOCK_GREETINGS[Math.floor(Math.random() * MOCK_GREETINGS.length)];
        state.recommendedGarmentId = null;
      } else if (intentVal === "CLARIFY") {
        state.intentType = "CLARIFY";
        state.stylingAdvice = MOCK_CLARIFY[Math.floor(Math.random() * MOCK_CLARIFY.length)];
        state.recommendedGarmentId = null;
      } else if (intentVal === "TRYON_SPECIFIC") {
        state.intentType = "TRYON_SPECIFIC";
        if (state.garmentImageUrl) {
          const title = state.garmentTitle || latestQuery.replace("I want to try on this item: ", "").trim() || "Selected Item";
          state.stylingAdvice = `Great pick! ✨ I'm preparing your virtual try-on for **${title}**. This will just take a moment!`;
          const itemId = state.recommendedGarmentId || `direct_${Date.now().toString(36)}`;
          state.recommendedItems = [{ itemId, title, imageUrl: state.garmentImageUrl }];
        } else {
          state.stylingAdvice = "I'd love to help you try that on! Could you share a product link or upload a garment photo so I can get started?";
        }
      } else {
        // SEARCH — keyword extraction + live scraper (works without Gemini!)
        state.intentType = "SEARCH";
        const searchString = extractSearchQuery(latestQuery, state.userGender);
        console.log(`[Stylist] Mock search query: ${searchString}`);

        const liveItems = await searchLiveRetailer(searchString);
        if (liveItems.length > 0) {
          state.recommendedItems = liveItems;
          const first = liveItems[0];
          state.recommendedGarmentId = first.itemId;
          state.garmentImageUrl = first.imageUrl;
          state.garmentTitle = first.title;
          state.stylingAdvice = `I found ${liveItems.length} options for you! 🛍️ The top result is **${first.title}**. Swipe through the cards below and tap "Try On" on any item you'd like to see on yourself!`;
        } else {
          state.stylingAdvice = `I searched for "${searchString}" but couldn't find results right now. Could you try being more specific — like "blue cotton shirt" or "black formal blazer"?`;
          state.recommendedGarmentId = null;
          state.recommendedItems = [];
        }
      }
    }

    console.log(`[Stylist] Intent: ${state.intentType}`);
  } catch (error) {
    console.error(`[Stylist] Error: ${error}`);
    state.stylingAdvice =
      "I encountered an issue while processing your request. Please try again.";
    state.error = String(error);
  }

  state.currentAgent = "stylist";
  return state;
}
