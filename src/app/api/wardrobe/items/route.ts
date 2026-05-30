import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();
    
    // Fetch items sorted by newest first
    const { data: items, error } = await supabase
      .from("wardrobe_items")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Failed to fetch wardrobe items:", error);
      return NextResponse.json(
        { error: `Database fetch failed: ${error.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({ items });
  } catch (error) {
    console.error("Error in GET /api/wardrobe/items:", error);
    return NextResponse.json(
      { error: "Failed to fetch items" },
      { status: 500 }
    );
  }
}
