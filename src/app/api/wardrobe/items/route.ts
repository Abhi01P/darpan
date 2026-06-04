import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }
    
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

    // Refresh signed URLs for items stored in the bucket
    if (items) {
      for (const item of items) {
        if (item.image_url && item.image_url.includes('wardrobe-images')) {
          const urlParts = item.image_url.split('/');
          let fileName = urlParts.pop();
          if (fileName) {
            // Strip any existing query parameters (like previous signed URL tokens)
            fileName = fileName.split('?')[0];
            const { data: signedData } = await supabase.storage
              .from('wardrobe-images')
              .createSignedUrl(fileName, 3600);
            
            if (signedData?.signedUrl) {
              item.image_url = signedData.signedUrl;
            }
          }
        }
      }
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
