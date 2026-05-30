import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { generateTryOn } from "@/lib/agents/artist";

export async function POST(req: Request) {
  try {
    // 1. Auth check
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // 2. Parse request
    const body = await req.json();
    const { userImageUrl, garmentImageUrl } = body;

    if (!userImageUrl || !garmentImageUrl) {
      return NextResponse.json(
        {
          error:
            "Both userImageUrl and garmentImageUrl are required.",
        },
        { status: 400 }
      );
    }

    // 3. Run the Artist agent directly for try-on generation
    console.log("[Try-On API] Starting generation...");
    const result = await generateTryOn(userImageUrl, garmentImageUrl);

    if (result.error) {
      return NextResponse.json(
        {
          error: result.error,
          resultUrl: null,
        },
        { status: 422 }
      );
    }

    return NextResponse.json({
      resultUrl: result.resultUrl,
      error: null,
    });
  } catch (error) {
    console.error("[Try-On API] Error:", error);
    return NextResponse.json(
      {
        error: "Failed to generate try-on image. Please try again.",
        resultUrl: null,
      },
      { status: 500 }
    );
  }
}
