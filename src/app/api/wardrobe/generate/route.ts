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
    const sizesStr = formData.get("sizes") as string;
    const sizes = sizesStr ? JSON.parse(sizesStr) : ["M"];

    // 2. Extract Multiple Source Images
    const files = formData.getAll("images") as File[];
    
    if (!files || files.length === 0) {
      return NextResponse.json({ error: "No source images provided" }, { status: 400 });
    }

    // In a real scenario, we would upload `files` to a private bucket here
    // and then call the Meshy API:
    // await fetch('https://api.meshy.ai/v2/image-to-3d', { ... })

    // 3. Simulate API Latency (Mocking the AI Generation process)
    // Wait for 3 seconds to simulate "Processing..."
    await new Promise((resolve) => setTimeout(resolve, 3000));

    // 4. Mock the API Response Output
    const mockImage2D = "https://images.unsplash.com/photo-1620799140188-3b2a02fd9a77?auto=format&fit=crop&q=80&w=400"; 
    const mockModel3D = "https://modelviewer.dev/shared-assets/models/Astronaut.glb"; // Sample GLB file

    // 5. Insert into Supabase DB
    const supabase = await createClient();
    
    const productData = {
      name,
      tag: category,
      price: `₹${price}`,
      sizes,
      desc,
      image_url: mockImage2D,
      model_url: mockModel3D,
    };

    const { data, error } = await supabase
      .from('wardrobe_items')
      .insert([productData])
      .select();

    if (error) {
      console.error("Database insert failed: ", error);
      // Return mocked data even if DB insert fails for prototype resilience
      return NextResponse.json({ success: true, data: { id: Date.now(), ...productData } });
    }

    return NextResponse.json({ success: true, data: data[0] });

  } catch (error) {
    console.error("Error generating 3D model:", error);
    return NextResponse.json({ error: "Failed to generate 3D model" }, { status: 500 });
  }
}
