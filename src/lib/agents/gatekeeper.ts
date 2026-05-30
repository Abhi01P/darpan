// ─── Gatekeeper Agent ───────────────────────────────────────
// TypeScript port of DrapeNet's gatekeeper.py
// Validates inputs, scrapes product URLs, and routes requests.

import type { AgentState } from "./types";
import { extractProductInfo } from "../scraper";
import { randomUUID } from "crypto";

/**
 * Gatekeeper Agent — the pipeline's front door.
 * 
 * Responsibilities:
 * - Validates that there's something to work with (image or chat)
 * - Scrapes product URLs to extract garment images
 * - Intercepts direct "try on this item" commands for fast routing
 * - Sets image_type for downstream routing decisions
 */
export async function runGatekeeper(state: AgentState): Promise<AgentState> {
  console.log("[Gatekeeper] Analyzing inputs");

  const hasImage = Boolean(state.userImageUrl);
  const hasChat = state.chatHistory.length > 0;

  // Reject if there's nothing to work with
  if (!hasImage && !hasChat) {
    return {
      ...state,
      imageType: "invalid",
      validationMessage: "Please upload a photo or ask me something.",
      currentAgent: "gatekeeper",
    };
  }

  // If a product URL was provided, scrape it for the garment image
  if (state.garmentPageUrl && !state.garmentImageUrl) {
    console.log(
      "[Gatekeeper] External product URL detected. Initiating extraction..."
    );
    try {
      const extracted = await extractProductInfo(state.garmentPageUrl);
      if (extracted) {
        state.garmentImageUrl = extracted.imageUrl;
        state.garmentTitle = extracted.title;
        state.validationMessage = `Successfully extracted '${extracted.title}'.`;
      } else {
        state.validationMessage =
          "Failed to extract product image from URL.";
      }
    } catch (error) {
      console.warn(`[Gatekeeper] Scraping failed: ${error}`);
      state.validationMessage = "Could not extract product from URL.";
    }
  } else {
    state.validationMessage = "Input validated successfully.";
  }

  // Intercept direct try-on commands to skip Stylist LLM call
  const lastMessage = state.chatHistory[state.chatHistory.length - 1];
  if (lastMessage?.content?.startsWith("I want to try on this item:")) {
    const title =
      state.garmentTitle ||
      lastMessage.content.replace("I want to try on this item: ", "").trim() ||
      "Selected Item";

    state.stylingAdvice = `Great choice! I'm sending the '${title}' to the fitting room right now.`;
    state.intentType = "TRYON_SPECIFIC";

    if (state.garmentImageUrl) {
      state.recommendedItems = [
        {
          itemId:
            state.recommendedGarmentId ||
            `direct_${randomUUID().slice(0, 8)}`,
          title,
          imageUrl: state.garmentImageUrl,
        },
      ];
    }
  }

  state.imageType = "full_body";
  state.currentAgent = "gatekeeper";

  console.log(
    `[Gatekeeper] Passed — image=${hasImage}, chat=${hasChat}`
  );
  return state;
}

/**
 * Determines routing after Gatekeeper:
 * - "invalid" → end (bad input)
 * - Direct try-on command → artist (skip stylist)
 * - Chat history present → stylist
 * - Otherwise → artist
 */
export function routeGatekeeper(
  state: AgentState
): "stylist" | "artist" | "end" {
  if (state.imageType === "invalid") return "end";

  const lastMessage = state.chatHistory[state.chatHistory.length - 1];
  if (lastMessage?.content?.startsWith("I want to try on this item:")) {
    return "artist";
  }

  if (state.chatHistory.length > 0) {
    return "stylist";
  }

  return "artist";
}
