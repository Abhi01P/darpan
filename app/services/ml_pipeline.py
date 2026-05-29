import os
import uuid
import requests
from google import genai
from google.genai import types
from app.core.config import settings

def download_image_bytes(url: str) -> bytes:
    """Helper to fetch image bytes from a URL."""
    # Handle the case where the frontend sends a localhost URL 
    # to the Docker backend — read from disk directly to avoid
    # network loopback issues inside Docker/Celery.
    static_prefix = f"{settings.BASE_URL}/static/"
    if url.startswith(static_prefix):
        filename = url.split("/")[-1]
        local_path = os.path.join("uploads", filename)
        with open(local_path, "rb") as f:
            return f.read()
            
    response = requests.get(url, timeout=10)
    response.raise_for_status()
    return response.content

def generate_local_tryon(person_image_url: str, garment_image_url: str) -> str:
    """
    Executes the Virtual Try-On using Google's next-generation Multimodal Image family
    (gemini-2.5-flash-image). It natively blends images and changes outfits via dialogue.
    """
    print(f"--- [Artist] Initiating Gemini 2.5 Flash Image Generation... ---")
    
    # Credentials are set once in config.py at import time
    
    try:
        # Initialize the GenAI client using Vertex AI integration
        client = genai.Client(
            vertexai=True,
            project=settings.GCP_PROJECT_ID,
            location=settings.GCP_LOCATION,
        )
        
        print("--- [Artist] Downloading source images for Gemini context... ---")
        person_bytes = download_image_bytes(person_image_url)
        garment_bytes = download_image_bytes(garment_image_url)
        
        # We construct a multimodal prompt using the specific AI Photoshop approach
        prompt = (
            "You are an expert digital fashion editor. Look at the person in the first image, "
            "and look at the clothing item in the second image. "
            "Seamlessly change the outfit of the person in the first image so they are wearing "
            "the exact garment from the second image. "
            "CRITICAL INSTRUCTION: You absolutely MUST preserve the exact face, facial features, "
            "hair, and identity of the person in the first image. DO NOT alter their face in any way. "
            "Only change the clothing. Ensure the lighting and body pose remain perfectly consistent."
        )
        
        contents = [
            types.Part.from_bytes(data=person_bytes, mime_type="image/jpeg"),
            types.Part.from_bytes(data=garment_bytes, mime_type="image/jpeg"),
            prompt
        ]
        
        print("--- [Artist] Calling gemini-2.5-flash-image for native blending... ---")
        
        result = client.models.generate_content(
            model="gemini-2.5-flash-image",
            contents=contents,
            config=types.GenerateContentConfig(
                response_modalities=["IMAGE"],
            )
        )
        
        if not result.candidates or not result.candidates[0].content.parts:
            raise Exception("Gemini API returned no images.")
            
        # The generated image bytes are stored in inline_data
        part = result.candidates[0].content.parts[0]
        if not part.inline_data:
             raise Exception("Gemini API returned empty image data.")
        
        # Save the returned image byte payload to our static uploads directory
        file_name = f"tryon_gemini25_{uuid.uuid4().hex}.jpg"
        save_path = os.path.join("uploads", file_name)
        
        with open(save_path, "wb") as f:
            f.write(part.inline_data.data)
            
        print("--- [Artist] Gemini Multimodal Synthesis Successful! ---")
        
        # Return the URL so Next.js can render it
        return f"{settings.BASE_URL}/static/{file_name}"
        
    except Exception as e:
        print(f"--- [Artist] Gemini Inference Failed: {e} ---")
        raise e
