// ─── AI Service — Gemini Agentic Pipeline ───────────────────
// Replaces the old Mock/OpenAI dual-service pattern with a
// production Gemini-powered 3-agent pipeline (Gatekeeper →
// Stylist → Artist) from DrapeNet.

import type { AIResponse, ChatContext } from "./types/ai-chat";
import { runPipeline } from "./agents/workflow";
import type { ChatHistoryMessage } from "./agents/types";

// ─── URL Detection Helper ───────────────────────────────────

const URL_REGEX = /https?:\/\/[^\s]+/gi;

function extractUrls(text: string): string[] {
  return text.match(URL_REGEX) || [];
}

// ─── Gemini Agent Service ───────────────────────────────────

export async function processChat(
  messages: { role: "user" | "assistant"; content: string }[],
  context?: ChatContext
): Promise<AIResponse> {
  // Check if the last message contains a product URL
  const lastMsg = messages[messages.length - 1]?.content || "";
  const urls = extractUrls(lastMsg);

  // Convert to pipeline format
  const chatHistory: ChatHistoryMessage[] = messages.map((m) => ({
    role: m.role,
    content: m.content,
  }));

  // Run the full 3-agent pipeline
  const pipelineResult = await runPipeline({
    messages: chatHistory,
    userImageUrl: context?.userImageUrl || null,
    garmentImageUrl: context?.garmentImageUrl || null,
    garmentPageUrl: urls[0] || context?.garmentPageUrl || null,
    userGender: context?.userGender || null,
  });

  // Build suggested actions from pipeline results
  const suggestedActions = [];

  if (pipelineResult.recommendedItems.length > 0) {
    suggestedActions.push({
      label: "Try On Top Pick",
      type: "try-on" as const,
      payload: {
        url: pipelineResult.recommendedItems[0].imageUrl,
        title: pipelineResult.recommendedItems[0].title,
      },
    });
  }

  return {
    reply: pipelineResult.reply,
    recommendedItems: pipelineResult.recommendedItems.map((item) => ({
      itemId: item.itemId,
      title: item.title,
      imageUrl: item.imageUrl,
    })),
    tryOnResultUrl: pipelineResult.tryOnResultUrl,
    intentType: pipelineResult.intentType,
    suggestedActions,
  };
}
