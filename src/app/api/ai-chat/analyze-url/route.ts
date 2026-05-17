import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { getAIService } from "@/lib/ai-service";
import type { AnalyzeURLResponse } from "@/lib/types/ai-chat";

export async function POST(req: Request) {
  try {
    // 1. Auth check
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Authentication required" } as AnalyzeURLResponse & { error: string },
        { status: 401 }
      );
    }

    // 2. Parse request
    const body = await req.json();
    const { url } = body;

    if (!url || typeof url !== "string") {
      return NextResponse.json(
        { error: "A valid URL is required" } as AnalyzeURLResponse & { error: string },
        { status: 400 }
      );
    }

    // 3. Validate URL format
    try {
      new URL(url);
    } catch {
      return NextResponse.json(
        { error: "Invalid URL format" } as AnalyzeURLResponse & { error: string },
        { status: 400 }
      );
    }

    // 4. Analyze via AI service
    const aiService = getAIService();
    const productData = await aiService.analyzeProductUrl(url);

    // 5. Return product data
    return NextResponse.json({ productData } as AnalyzeURLResponse);
  } catch (error) {
    console.error("[Analyze URL] Error:", error);
    return NextResponse.json(
      { error: "Failed to analyze the URL. Please try again." },
      { status: 500 }
    );
  }
}
