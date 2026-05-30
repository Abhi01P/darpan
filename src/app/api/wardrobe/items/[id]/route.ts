import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json(
        { error: "Item ID is required" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // 1. Fetch item to get the image_url
    const { data: itemData, error: fetchError } = await supabase
      .from("wardrobe_items")
      .select("image_url")
      .eq("id", id)
      .single();

    if (fetchError) {
      console.error("Failed to fetch item for deletion:", fetchError);
    }

    // 2. Extract filename and delete from storage
    if (itemData?.image_url) {
      try {
        const urlParts = itemData.image_url.split('/');
        const fileName = urlParts.pop();
        
        // Only attempt to delete if we got a filename and it looks like it belongs to our bucket
        // (Avoiding deletion of external URLs if any)
        if (fileName && itemData.image_url.includes('wardrobe-images')) {
          const { error: storageError } = await supabase.storage
            .from("wardrobe-images")
            .remove([fileName]);
            
          if (storageError) {
            console.error("Failed to delete image from bucket:", storageError);
          }
        }
      } catch (err) {
        console.error("Error parsing or deleting image URL:", err);
      }
    }

    const { error } = await supabase
      .from("wardrobe_items")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Failed to delete wardrobe item:", error);
      return NextResponse.json(
        { error: `Failed to delete item: ${error.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in DELETE /api/wardrobe/items/[id]:", error);
    return NextResponse.json(
      { error: "Failed to delete item" },
      { status: 500 }
    );
  }
}
