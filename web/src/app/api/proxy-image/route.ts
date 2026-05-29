import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get('url');

  if (!url) {
    return new NextResponse('No URL provided', { status: 400 });
  }

  try {
    const response = await fetch(url);
    if (!response.ok) {
      return new NextResponse(`Failed to fetch image: ${response.statusText}`, { status: response.status });
    }

    const buffer = await response.arrayBuffer();
    const headers = new Headers();
    
    // Copy the content type from the original image
    headers.set('Content-Type', response.headers.get('content-type') || 'image/jpeg');
    headers.set('Cache-Control', 'public, max-age=31536000');
    
    // Explicitly allow Cross-Origin Resource Sharing so WebGL can load it as a texture
    headers.set('Access-Control-Allow-Origin', '*');

    return new NextResponse(buffer, { headers });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    console.error("Image proxy error:", msg);
    return new NextResponse(`Error proxying image: ${msg}`, { status: 500 });
  }
}
