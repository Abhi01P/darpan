import asyncio
import os
from dotenv import load_dotenv

load_dotenv()

from app.core.db import get_vector_store
from langchain_core.documents import Document

async def seed():
    # The actual embedding uses Gemini via Vertex AI, which authenticates
    # through GOOGLE_APPLICATION_CREDENTIALS set in config.py.
    # We just need the credentials file to exist.
    from app.core.config import settings
    if not os.path.exists(settings.GOOGLE_CREDENTIALS_PATH):
        print(f"Skipping DB seed. Credentials file '{settings.GOOGLE_CREDENTIALS_PATH}' not found.")
        return

    print("Seeding database with mock fashion items...")
    vector_store = get_vector_store()
    
    docs = [
        Document(
            page_content="A lightweight, breathable linen button-down shirt in pastel blue. Perfect for hot weather, beach vacations, and summer weddings. Relaxed fit.",
            metadata={"item_id": "shirt_linen_blue_01", "image_url": "https://mock-storage.com/shirt_linen_blue.jpg"}
        ),
        Document(
            page_content="Heavyweight selvedge denim jacket in dark indigo. Features brass hardware and a tailored, slim fit. Great for fall weather and layering.",
            metadata={"item_id": "jacket_denim_02", "image_url": "https://mock-storage.com/jacket_denim.jpg"}
        ),
        Document(
            page_content="Flowy, floral print midi dress with a V-neckline and short sleeves. Made from sustainable viscose. Ideal for spring outings and casual brunches.",
            metadata={"item_id": "dress_floral_03", "image_url": "https://mock-storage.com/dress_floral.jpg"}
        )
    ]
    
    # In a real scenario, make sure the index is created in Atlas first
    try:
        vector_store.add_documents(docs)
        print(f"Successfully added {len(docs)} items to the vector store.")
    except Exception as e:
        print(f"Failed to add documents. Ensure MongoDB is running and Vector Search index is configured. Error: {e}")

if __name__ == "__main__":
    asyncio.run(seed())
