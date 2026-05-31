// ─── Agent Workflow ──────────────────────────────────────────
// TypeScript port of DrapeNet's workflow.py
// Pure TS state machine — Gatekeeper → Stylist → Artist.
// No LangGraph dependency; the routing is simple enough for a
// sequential pipeline with conditional edges.

import type { PipelineResult, ChatHistoryMessage } from "./types";
import { createInitialState } from "./types";
import { runGatekeeper, routeGatekeeper } from "./gatekeeper";
import { runStylist } from "./stylist";
import { runArtist } from "./artist";

export interface PipelineInput {
  messages: ChatHistoryMessage[];
  userImageUrl?: string | null;
  garmentImageUrl?: string | null;
  garmentPageUrl?: string | null;
  userGender?: "male" | "female" | "non-binary" | null;
  dislikedItems?: string[];
}

/**
 * Runs the full 3-agent pipeline:
 * Gatekeeper → (conditional routing) → Stylist → Artist → Response
 *
 * This is the main entry point for the AI chat API route.
 */
export async function runPipeline(
  input: PipelineInput
): Promise<PipelineResult> {
  console.log("═══ Starting DrapeNet Pipeline ═══");

  // Initialize state
  let state = createInitialState({
    chatHistory: input.messages,
    userImageUrl: input.userImageUrl || null,
    garmentImageUrl: input.garmentImageUrl || null,
    garmentPageUrl: input.garmentPageUrl || null,
    userGender: input.userGender || null,
    dislikedItems: input.dislikedItems || [],
  });

  // ── Step 1: Gatekeeper ─────────────────────────────────
  state = await runGatekeeper(state);

  const route = routeGatekeeper(state);
  console.log(`[Workflow] Gatekeeper routed to: ${route}`);

  if (route === "end") {
    return {
      reply:
        state.validationMessage ||
        "Please upload a photo or ask me something about fashion.",
      intentType: null,
      recommendedItems: [],
      tryOnResultUrl: null,
      error: state.error,
    };
  }

  // ── Step 2: Stylist (if routed) ────────────────────────
  if (route === "stylist") {
    state = await runStylist(state);
  }

  // ── Step 3: Artist (if user image + garment image available)
  // Python workflow: workflow.add_edge("stylist", "artist") — Artist always
  // runs after Stylist. It skips internally if images aren't available.
  if (state.userImageUrl && state.garmentImageUrl) {
    state = await runArtist(state);
  }

  console.log("═══ Pipeline Complete ═══");

  // Build the response
  return {
    reply: state.stylingAdvice || state.validationMessage || "How can I help you with fashion today?",
    intentType: state.intentType,
    recommendedItems: state.recommendedItems,
    tryOnResultUrl: state.finalOutputUrl,
    error: state.error,
  };
}
