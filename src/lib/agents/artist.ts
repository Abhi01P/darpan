// ─── Artist Agent ───────────────────────────────────────────
// TypeScript port of DrapeNet's artist.py + ml_pipeline.py
// Virtual try-on via Gemini multimodal image generation.
// Falls back to a side-by-side preview mock when no API key.

import { GoogleGenerativeAI } from "@google/generative-ai";
import type { AgentState } from "./types";

// Use the public SDK's image generation model
// (Python uses gemini-2.5-flash-image via Vertex AI — this is the equivalent
// available via the @google/generative-ai SDK with an API key)
const TRYON_MODEL = "gemini-2.0-flash-preview-image-generation";

function hasGeminiKey(): boolean {
  return Boolean(process.env.GEMINI_API_KEY);
}

/**
 * Downloads an image from a URL and returns it as a base64 string
 * along with its MIME type.
 */
async function downloadImageAsBase64(
  url: string
): Promise<{ base64: string; mimeType: string }> {
  // If it's already a Data URI, parse it directly to avoid fetch overhead
  if (url.startsWith("data:")) {
    const matches = url.match(/^data:([^;]+);base64,(.+)$/);
    if (matches && matches.length === 3) {
      return { mimeType: matches[1], base64: matches[2] };
    }
  }

  const response = await fetch(url, {
    signal: AbortSignal.timeout(15000),
  });

  if (!response.ok) {
    throw new Error(`Failed to download image: HTTP ${response.status}`);
  }

  const contentType = response.headers.get("content-type") || "image/jpeg";
  const buffer = await response.arrayBuffer();
  const base64 = Buffer.from(buffer).toString("base64");

  return {
    base64,
    mimeType: contentType.split(";")[0].trim(),
  };
}

/**
 * Generates a mock try-on preview: an SVG showing the garment image
 * with a "Virtual Try-On Preview" overlay. No API key needed.
 */
function generateMockTryOn(garmentImageUrl: string): string {
  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="512" height="680" viewBox="0 0 512 680">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#1a1018"/>
      <stop offset="100%" stop-color="#2a1f28"/>
    </linearGradient>
    <linearGradient id="shine" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#c4a7d4" stop-opacity="0.3"/>
      <stop offset="100%" stop-color="#e8b4c8" stop-opacity="0.1"/>
    </linearGradient>
  </defs>
  <rect width="512" height="680" fill="url(#bg)"/>
  <rect x="56" y="60" width="400" height="480" rx="12" fill="#0a0a0a" opacity="0.4"/>
  <image href="${garmentImageUrl}" x="66" y="70" width="380" height="460" preserveAspectRatio="xMidYMid meet" clip-path="inset(0 round 8px)"/>
  <rect x="56" y="60" width="400" height="480" rx="12" fill="url(#shine)"/>
  <rect x="56" y="460" width="400" height="80" rx="0" fill="rgba(0,0,0,0.6)"/>
  <text x="256" y="508" text-anchor="middle" fill="#e8dce0" font-family="sans-serif" font-size="16" font-weight="600" letter-spacing="2">✨ VIRTUAL TRY-ON PREVIEW</text>
  <rect x="0" y="580" width="512" height="100" fill="rgba(0,0,0,0.4)"/>
  <text x="256" y="620" text-anchor="middle" fill="#c4a7d4" font-family="sans-serif" font-size="12" letter-spacing="1" opacity="0.8">DEMO MODE — No API key configured</text>
  <text x="256" y="648" text-anchor="middle" fill="#8a7a82" font-family="sans-serif" font-size="11" opacity="0.6">Add GEMINI_API_KEY for AI-powered try-on</text>
</svg>`.trim();

  const base64 = Buffer.from(svg).toString("base64");
  return `data:image/svg+xml;base64,${base64}`;
}

/**
 * Artist Agent — the pipeline's hands.
 *
 * When GEMINI_API_KEY is set: Uses Gemini's multimodal image generation
 * with responseModalities: ["IMAGE", "TEXT"] to generate virtual try-on.
 * When not set: Returns a styled garment preview SVG (no AI generation).
 */
export async function runArtist(state: AgentState): Promise<AgentState> {
  console.log("[Artist] Initiating 2D Virtual Try-On");

  const userImage = state.userImageUrl;
  const garmentImage = state.garmentImageUrl;

  if (!userImage || !garmentImage) {
    console.log("[Artist] Missing images, skipping try-on generation");
    state.currentAgent = "artist";
    return state;
  }

  // ── Mock Mode ──────────────────────────────────────────
  if (!hasGeminiKey()) {
    console.log("[Artist] No API key — generating mock preview");
    state.finalOutputUrl = generateMockTryOn(garmentImage);
    state.tryOnTaskId = `mock_${Date.now().toString(36)}`;
    state.currentAgent = "artist";
    return state;
  }

  // ── Gemini Mode ────────────────────────────────────────
  try {
    const genai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    const model = genai.getGenerativeModel({
      model: TRYON_MODEL,
      // Request image output from the model — matches Python's
      // config=types.GenerateContentConfig(response_modalities=["IMAGE"])
      // The SDK types don't include responseModalities yet, so we cast.
      generationConfig: {
        responseModalities: ["IMAGE", "TEXT"],
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any,
    });

    console.log("[Artist] Downloading source images...");
    const [personData, garmentData] = await Promise.all([
      downloadImageAsBase64(userImage),
      downloadImageAsBase64(garmentImage),
    ]);

    // The critical identity-preservation prompt from DrapeNet's ml_pipeline.py
    const prompt = `You are an expert digital fashion editor. Look at the person in the first image, and look at the clothing item in the second image.

Seamlessly change the outfit of the person in the first image so they are wearing the exact garment from the second image.

CRITICAL INSTRUCTION: You absolutely MUST preserve the exact face, facial features, hair, and identity of the person in the first image. DO NOT alter their face in any way.

Only change the clothing. Ensure the lighting and body pose remain perfectly consistent.

Generate a single photorealistic result image.`;

    console.log(`[Artist] Calling ${TRYON_MODEL} for virtual try-on...`);

    const result = await model.generateContent([
      {
        inlineData: {
          data: personData.base64,
          mimeType: personData.mimeType,
        },
      },
      {
        inlineData: {
          data: garmentData.base64,
          mimeType: garmentData.mimeType,
        },
      },
      prompt,
    ]);

    const response = result.response;
    const parts = response.candidates?.[0]?.content?.parts;

    if (!parts || parts.length === 0) {
      throw new Error("Gemini API returned no content.");
    }

    // Look for inline image data in the response
    const imagePart = parts.find(
      (part) => part.inlineData?.data
    );

    if (imagePart?.inlineData) {
      const mimeType = imagePart.inlineData.mimeType || "image/png";
      const base64Data = imagePart.inlineData.data;
      state.finalOutputUrl = `data:${mimeType};base64,${base64Data}`;
      state.tryOnTaskId = `tryon_${Date.now().toString(36)}`;
      console.log("[Artist] Virtual try-on generation successful!");
    } else {
      // Gemini returned text instead of image — fall back to mock
      console.warn("[Artist] Gemini did not return an image, using mock preview");
      state.finalOutputUrl = generateMockTryOn(garmentImage);
      state.tryOnTaskId = `mock_${Date.now().toString(36)}`;
    }
  } catch (error) {
    console.error(`[Artist] Error during try-on: ${error}`);
    // Fall back to mock on any error
    console.log("[Artist] Falling back to mock preview");
    state.finalOutputUrl = generateMockTryOn(garmentImage);
    state.tryOnTaskId = `mock_${Date.now().toString(36)}`;
  }

  state.currentAgent = "artist";
  return state;
}

/**
 * Standalone try-on function for the dedicated /api/try-on endpoint.
 * Runs just the Artist without the full pipeline.
 */
export async function generateTryOn(
  userImageUrl: string,
  garmentImageUrl: string
): Promise<{ resultUrl: string | null; error: string | null }> {
  const state: AgentState = {
    userImageUrl,
    garmentImageUrl,
    garmentPageUrl: null,
    userGender: null,
    chatHistory: [],
    dislikedItems: [],
    imageType: "full_body",
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
  };

  const result = await runArtist(state);
  return {
    resultUrl: result.finalOutputUrl,
    error: result.error,
  };
}
