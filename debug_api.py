import os
from dotenv import load_dotenv
from google import genai

# Force reload .env
load_dotenv(override=True)

api_key = os.getenv("GEMINI_API_KEY")

if not api_key:
    print("❌ ERROR: GEMINI_API_KEY not found in environment!")
    exit(1)

# Mask the key for display
masked_key = f"{api_key[:5]}...{api_key[-5:]}" if len(api_key) > 10 else "INVALID_KEY"
print(f"🔑 Loaded API Key: {masked_key}")

models_to_try = [
    "gemini-1.5-flash",
    "models/gemini-1.5-flash", 
    "gemini-flash-latest",
    "models/gemini-flash-latest",
    "gemini-1.5-flash-001",
    "gemini-1.5-flash-002"
]

client = genai.Client(api_key=api_key)

print("📡 Testing multiple models...")

for model_name in models_to_try:
    print(f"\n👉 Testing model: {model_name}")
    try:
        response = client.models.generate_content(
            model=model_name,
            contents='Hello'
        )
        print(f"✅ SUCCESS with {model_name}!")
        print(f"📝 Response: {response.text}")
        break
    except Exception as e:
        print(f"❌ Failed with {model_name}: {e}")

