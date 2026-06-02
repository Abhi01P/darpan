import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { processChat } from "@/lib/ai-service";
import type { ChatAPIRequest, ChatAPIResponse } from "@/lib/types/ai-chat";

export async function POST(req: Request) {
  try {
    // 1. Auth check
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Authentication required" } as ChatAPIResponse,
        { status: 401 }
      );
    }

    // 2. Parse request
    const body: ChatAPIRequest = await req.json();

    if (!body.messages || body.messages.length === 0) {
      return NextResponse.json(
        { error: "No messages provided" } as ChatAPIResponse,
        { status: 400 }
      );
    }

    // 3. Run the Gemini agentic pipeline
    const response = await processChat(body.messages, body.context);

    // 4. Return the full pipeline response
    return NextResponse.json({
      reply: response.reply,
      productData: response.productData || null,
      suggestedActions: response.suggestedActions || [],
      recommendedItems: response.recommendedItems || [],
      tryOnResultUrl: response.tryOnResultUrl || null,
      originalTryOnUrl: response.originalTryOnUrl || null,
      intentType: response.intentType || null,
    } as ChatAPIResponse);
  } catch (error) {
    console.error("[AI Chat] Error:", error);
    return NextResponse.json(
      {
        error: "Failed to process your message. Please try again.",
        reply:
          "I'm sorry, something went wrong on my end. Please try again in a moment.",
      } as ChatAPIResponse,
      { status: 500 }
    );
  }
}
