import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();

    // 1. Extract Garment Data
    const name = formData.get("name") as string;
    const category = formData.get("category") as string;
    const price = formData.get("price") as string;
    const desc = formData.get("desc") as string;
    const ratingStr = formData.get("rating") as string;
    const rating = ratingStr ? parseFloat(ratingStr) : null;
    const sizesStr = formData.get("sizes") as string;
    const sizes = sizesStr ? JSON.parse(sizesStr) : ["M"];

    const providedImageUrl = formData.get("imageUrl") as string;
    const files = formData.getAll("images") as File[];

    if ((!files || files.length === 0) && !providedImageUrl) {
      return NextResponse.json({ error: "No source images or image URL provided" }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    let finalImageUrl = '';
    const bucketName = 'wardrobe-images';

    try {
      if (files && files.length > 0) {
        // Upload first file
        const file = files[0];
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from(bucketName)
          .upload(fileName, file, { contentType: file.type });

        if (uploadError) throw uploadError;

        const { data: signedData, error: signedError } = await supabase.storage
          .from(bucketName)
          .createSignedUrl(fileName, 3600);

        if (!signedError && signedData) {
          finalImageUrl = signedData.signedUrl;
        }
      } else if (providedImageUrl) {
        // Fetch URL and upload
        const imgResponse = await fetch(providedImageUrl);
        if (!imgResponse.ok) throw new Error("Failed to fetch provided image URL");

        const blob = await imgResponse.blob();
        // Try to guess extension from content type or URL
        let ext = 'jpg';
        if (blob.type === 'image/png') ext = 'png';
        else if (blob.type === 'image/webp') ext = 'webp';

        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${ext}`;

        const { error: uploadError } = await supabase.storage
          .from(bucketName)
          .upload(fileName, blob, { contentType: blob.type });

        if (uploadError) throw uploadError;

        const { data: signedData, error: signedError } = await supabase.storage
          .from(bucketName)
          .createSignedUrl(fileName, 3600);

        if (!signedError && signedData) {
          finalImageUrl = signedData.signedUrl;
        }
      }
    } catch (uploadErr) {
      console.error("Image upload failed:", uploadErr);
      // Fallback to provided URL directly if bucket upload fails, or mock image
      finalImageUrl = providedImageUrl || finalImageUrl;
    }


    const productData = {
      name,
      tag: category,
      price: `₹${price}`,
      sizes,
      desc,
      image_url: finalImageUrl,
      rating,
      user_id: user.id,
    };

    const { data, error } = await supabase
      .from('wardrobe_items')
      .insert([productData])
      .select();

    if (error) {
      console.error("Database insert failed: ", error);
      return NextResponse.json({ error: `Database insert failed: ${error.message}` }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: data[0] });

  } catch (error) {
    console.error("Error generating 3D model:", error);
    return NextResponse.json({ error: "Failed to generate 3D model" }, { status: 500 });
  }
}
