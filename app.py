

from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel
import pandas as pd
from google import genai
from google.genai import types
import os
import re
import json
from dotenv import load_dotenv

# -----------------------------
# Load Gemini API Key from .env
# -----------------------------
load_dotenv()
API_KEY = os.getenv("GEMINI_API_KEY")
if not API_KEY:
    raise ValueError("GEMINI_API_KEY not found in environment variables")

# Configure the new genai client
client = genai.Client(api_key=API_KEY)

# -----------------------------
# FastAPI app
# -----------------------------
app = FastAPI(title="Intern Communication AI System")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for simplicity
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Get the directory where app.py is located
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# -----------------------------
# Skills categories in Excel
# -----------------------------
skills = [
    "Pronunciation Avg",
    "Grammar Avg",
    "Vocabulary Avg",
    "Fluency Avg",
    "Confidence Avg",
    "Body Language Avg"
]

# -----------------------------
# Threshold-based evaluation
# -----------------------------
def evaluate_scores(scores):
    thresholds = {
        "Excellent": 4.2,
        "Good": 3.5,
        "Average": 3.0,
        "Below Average": 0
    }
    results = {}
    for skill, value in scores.items():
        if value >= thresholds["Excellent"]:
            results[skill] = "Excellent"
        elif value >= thresholds["Good"]:
            results[skill] = "Good"
        elif value >= thresholds["Average"]:
            results[skill] = "Average"
        else:
            results[skill] = "Below Average"
    return results

# -----------------------------
# AI call function
# -----------------------------
def call_gemini(prompt_text):
    response = client.models.generate_content(
        model='gemini-flash-latest',
        contents=prompt_text
    )
    return response.text

# -----------------------------
# Parse AI JSON response
# -----------------------------
def parse_ai_response(ai_text):
    cleaned = re.sub(r"```json|```", "", ai_text).strip()
    try:
        parsed = json.loads(cleaned)
        return parsed
    except json.JSONDecodeError:
        return {"ai_text_raw": ai_text}

# -----------------------------
# Generate report
# -----------------------------
def generate_report(df, name: str):
    name = name.strip().lower()

    # Overall report
    if name == "overall":
        avg_scores = {skill: df[skill].mean() for skill in skills}
        evaluated = evaluate_scores(avg_scores)
        prompt = f"""
You are an expert communication coach. Analyze the overall communication performance of interns based on the following evaluated scores:

Scores Summary:
{evaluated}

IMPORTANT: Provide a detailed, professional JSON response. Do NOT use any markdown formatting symbols like **, __, ~~, or backticks in your response. Use plain text only.

Provide the following in JSON format:
- strengths (list of plain text strings)
- weaknesses (list of plain text strings)
- recommendations (list of plain text strings)
- motivational_note (plain text string)

Example format:
{{
  "strengths": ["Clear pronunciation demonstrates strong articulation", "Smooth fluency in communication"],
  "weaknesses": ["Grammar precision needs improvement", "Vocabulary range could be expanded"],
  "recommendations": ["Review fundamental grammar rules through online resources", "Read diverse materials to expand vocabulary"],
  "motivational_note": "Your strong communication foundation provides an excellent platform for continued growth and development."
}}
"""
        try:
            ai_response = call_gemini(prompt)
            ai_parsed = parse_ai_response(ai_response)
        except Exception as e:
            # Check if it's a quota error (429) or other API issue
            if "429" in str(e) or "RESOURCE_EXHAUSTED" in str(e):
                print("⚠️ API Quota Exceeded. Using Mock Data.")
                ai_parsed = {
                    "strengths": [
                        "Demonstrates clear articulation (Mock Demo)",
                        "Confidence is generally high during presentations (Mock Demo)"
                    ],
                    "weaknesses": [
                        "Pacing could be more consistent (Mock Demo)",
                        "Vocabulary variety usage is limited (Mock Demo)"
                    ],
                    "recommendations": [
                        "Practice with a metronome to regulate speaking speed",
                        "Read daily news articles to expand vocabulary context"
                    ],
                    "motivational_note": "Great effort! This is a generated mock response because the AI quota was exceeded."
                }
            else:
                raise e

        return {"type": "overall", "evaluated": evaluated, **ai_parsed}

    # Individual intern report
    df['Normalized Name'] = df.iloc[:, 0].apply(lambda x: str(x).strip().lower())
    row = df[df['Normalized Name'] == name]
    if not row.empty:
        row_data = row.iloc[0]
        scores = {skill: row_data[skill] for skill in skills}
        evaluated = evaluate_scores(scores)
        prompt = f"""
You are an expert communication coach. Analyze the communication performance of the following intern:

Name: {row_data.iloc[0]}
Scores:
{evaluated}

IMPORTANT: Provide a detailed, professional JSON response. Do NOT use any markdown formatting symbols like **, __, ~~, or backticks in your response. Use plain text only.

Provide the following in JSON format:
- strengths (list of plain text strings)
- weaknesses (list of plain text strings)  
- recommendations (list of plain text strings)
- motivational_note (plain text string)

Example format:
{{
  "strengths": ["Clear pronunciation demonstrates strong articulation", "Smooth fluency in communication"],
  "weaknesses": ["Grammar precision needs improvement", "Vocabulary range could be expanded"],
  "recommendations": ["Review fundamental grammar rules through online resources", "Read diverse materials to expand vocabulary"],
  "motivational_note": "Your strong communication foundation provides an excellent platform for continued growth and development."
}}
"""
        try:
            ai_response = call_gemini(prompt)
            ai_parsed = parse_ai_response(ai_response)
        except Exception as e:
            # Check if it's a quota error (429) or other API issue
            if "429" in str(e) or "RESOURCE_EXHAUSTED" in str(e):
                print(f"⚠️ API Quota Exceeded for {name}. Using Mock Data.")
                ai_parsed = {
                    "strengths": [
                        "Good eye contact maintained (Mock Demo)",
                        "Clear voice projection (Mock Demo)"
                    ],
                    "weaknesses": [
                        "Tendency to use filler words (Mock Demo)",
                        "Body language could be more open (Mock Demo)"
                    ],
                    "recommendations": [
                        "Record yourself to identify and reduce filler words",
                        "Practice power poses before presentations"
                    ],
                    "motivational_note": f"Keep going, {row_data.iloc[0]}! This is a mock response due to API limits."
                }
            else:
                raise e
            
        return {"type": "individual", "name": row_data.iloc[0], "evaluated": evaluated, **ai_parsed}
    else:
        raise HTTPException(status_code=404, detail="Intern not found")

# -----------------------------
# Upload Excel and generate report
# -----------------------------
@app.post("/report-upload")
async def upload_report(file: UploadFile = File(...), name: str = Form("overall")):
    temp_path = f"temp_{file.filename}"
    try:
        # Save uploaded file
        with open(temp_path, "wb") as f:
            f.write(await file.read())
        df = pd.read_excel(temp_path)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error reading Excel file: {e}")
    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)

    # Generate report
    report = generate_report(df, name)

    # Clean recommendations if needed
    if isinstance(report.get("recommendations"), list):
        clean_recs = []
        for rec in report["recommendations"]:
            if isinstance(rec, dict):
                clean_recs.append(rec.get("title") or rec.get("suggestion") or str(rec))
            else:
                clean_recs.append(str(rec))
        report["recommendations"] = clean_recs

    return report

# -----------------------------
# Get intern names from Excel
# -----------------------------
@app.post("/get-intern-names")
async def get_intern_names(file: UploadFile = File(...)):
    temp_path = f"temp_{file.filename}"
    try:
        # Save uploaded file
        with open(temp_path, "wb") as f:
            f.write(await file.read())
        df = pd.read_excel(temp_path)
        
        # Extract names from first column
        names = df.iloc[:, 0].astype(str).str.strip().tolist()
        
        return {"names": names}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error reading Excel file: {e}")
    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)

# -----------------------------
# Serve Frontend
# -----------------------------
@app.get("/")
async def serve_frontend():
    """Serve the main HTML file"""
    return FileResponse(os.path.join(BASE_DIR, "index.html"))

# Mount static files (CSS, JS)
app.mount("/static", StaticFiles(directory=BASE_DIR), name="static")

# -----------------------------
# Run the application
# -----------------------------
if __name__ == "__main__":
    import uvicorn
    print("🚀 Starting Intern Communication AI System...")
    print("📍 Server running at: http://127.0.0.1:8000")
    print("📖 Open your browser and navigate to the URL above")
    print("⚠️  Make sure your GEMINI_API_KEY is set in the .env file")
    print("\nPress CTRL+C to stop the server\n")
    uvicorn.run(app, host="127.0.0.1", port=8000)

