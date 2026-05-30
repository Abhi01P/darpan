import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { extractProductInfo } from "@/lib/scraper";

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
    const { url } = body;

    if (!url) {
      return NextResponse.json(
        { error: "URL is required." },
        { status: 400 }
      );
    }

    // 3. Scrape the product page
    console.log(`[Scrape API] Extracting product info from: ${url}`);
    const product = await extractProductInfo(url);

    if (!product) {
      return NextResponse.json(
        {
          error:
            "Could not extract product information from this URL. The site may block scraping or lack Open Graph metadata.",
        },
        { status: 422 }
      );
    }

    return NextResponse.json({
      title: product.title,
      imageUrl: product.imageUrl,
      sourceUrl: url,
      error: null,
    });
  } catch (error) {
    console.error("[Scrape API] Error:", error);
    return NextResponse.json(
      {
        error: "Failed to scrape product page. Please try again.",
      },
      { status: 500 }
    );
  }
}
