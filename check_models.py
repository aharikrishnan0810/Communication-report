from google import genai
import os
from dotenv import load_dotenv

load_dotenv()
API_KEY = os.getenv("GEMINI_API_KEY")

if not API_KEY:
    print("Error: GEMINI_API_KEY not found in .env")
    exit(1)

try:
    client = genai.Client(api_key=API_KEY)
    print("Attempting to list models...")
    # List models that support generateContent
    count = 0
    for model in client.models.list():
        if 'generateContent' in (model.supported_actions or []):
            print(f" - {model.name}")
            count += 1
    
    if count == 0:
        print("No models found with generateContent support.")
        
except Exception as e:
    print(f"Error listing models: {e}")
