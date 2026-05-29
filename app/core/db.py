from motor.motor_asyncio import AsyncIOMotorClient
from pymongo import MongoClient
from langchain_mongodb import MongoDBAtlasVectorSearch
from langchain_core.embeddings import Embeddings
from google import genai
from google.genai import types
from app.core.config import settings

class Database:
    client: AsyncIOMotorClient = None
    sync_client: MongoClient = None
    
db = Database()

def get_mongodb_client() -> AsyncIOMotorClient:
    """Gets the motor async client."""
    if db.client is None:
        db.client = AsyncIOMotorClient(settings.MONGODB_URL)
    return db.client

def get_sync_mongodb_client() -> MongoClient:
    """Gets the synchronous PyMongo client for Langchain VectorSearch."""
    if db.sync_client is None:
        db.sync_client = MongoClient(settings.MONGODB_URL)
    return db.sync_client

class CustomGenAIEmbeddings(Embeddings):
    """Custom wrapper for the new google.genai SDK to fit LangChain's Embeddings interface."""
    def __init__(self, model: str):
        self.model = model
        # Credentials are set once in config.py at import time via
        # os.environ["GOOGLE_APPLICATION_CREDENTIALS"], so the SDK
        # picks them up automatically.
        self.client = genai.Client(
            vertexai=True,
            project=settings.GCP_PROJECT_ID,
            location=settings.GCP_LOCATION,
        )
        
    def embed_documents(self, texts: list[str]) -> list[list[float]]:
        result = self.client.models.embed_content(
            model=self.model,
            contents=texts,
            config=types.EmbedContentConfig(task_type="SEMANTIC_SIMILARITY")
        )
        return [e.values for e in result.embeddings]
        
    def embed_query(self, text: str) -> list[float]:
        return self.embed_documents([text])[0]

def get_vector_store() -> MongoDBAtlasVectorSearch:
    """
    Initializes the connection to the specific collection used for Vector Search.
    Assumes an index named 'vector_index' is configured in MongoDB.
    """
    client = get_sync_mongodb_client()
    collection = client[settings.DATABASE_NAME]["fashion_items"]
    
    # Use the requested genai SDK integration with gemini-embedding-001
    embeddings = CustomGenAIEmbeddings(model="gemini-embedding-001")
    
    vector_store = MongoDBAtlasVectorSearch(
        collection=collection,
        embedding=embeddings,
        index_name="vector_index"
    )
    
    return vector_store
