import os
from google.cloud import aiplatform
os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = "key.json"
aiplatform.init(project="onix-ai", location="us-central1")
from vertexai.language_models import TextGenerationModel
from vertexai.generative_models import GenerativeModel
try:
    print("Testing gemini-1.5-flash-001...")
    model = GenerativeModel("gemini-1.5-flash-001")
    res = model.generate_content("hello")
    print(res.text)
except Exception as e:
    print("Failed flash:", e)
