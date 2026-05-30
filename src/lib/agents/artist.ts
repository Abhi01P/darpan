// ─── Artist Agent ───────────────────────────────────────────
// TypeScript port of DrapeNet's artist.py + ml_pipeline.py
// Virtual try-on via Gemini multimodal image generation.

import { GoogleGenerativeAI } from "@google/generative-ai";
import type { AgentState } from "./types";

const TRYON_MODEL = "gemini-2.0-flash-exp";

/**
 * Downloads an image from a URL and returns it as a base64 string
 * along with its MIME type.
 */
async function downloadImageAsBase64(
  url: string
): Promise<{ base64: string; mimeType: string }> {
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
 * Artist Agent — the pipeline's hands.
 *
 * Uses Gemini's multimodal image generation to synthesize a virtual
 * try-on image: the user wearing the garment, with identity preserved.
 *
 * Takes two images (person + garment) and returns a generated image
 * as a base64 data URL (no filesystem needed for Vercel).
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

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is not set");
    }

    const genai = new GoogleGenerativeAI(apiKey);
    const model = genai.getGenerativeModel({ model: TRYON_MODEL });

    console.log("[Artist] Downloading source images...");
    const [personData, garmentData] = await Promise.all([
      downloadImageAsBase64(userImage),
      downloadImageAsBase64(garmentImage),
    ]);

    // The critical identity-preservation prompt from DrapeNet
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
      // Gemini may have returned text instead of an image
      const textPart = parts.find((part) => part.text);
      console.warn(
        "[Artist] Gemini did not return an image. Text response:",
        textPart?.text?.slice(0, 200)
      );
      state.error =
        "The AI couldn't generate a try-on image for this combination. This can happen with certain garment types. Please try a different item.";
    }
  } catch (error) {
    console.error(`[Artist] Error during try-on: ${error}`);
    state.error = `Virtual try-on generation failed: ${error instanceof Error ? error.message : String(error)}`;
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
