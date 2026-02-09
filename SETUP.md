# 🚀 Quick Setup Guide

## Step 1: Add Your Gemini API Key

1. Open the `.env` file in your project folder
2. Replace `your_gemini_api_key_here` with your actual Gemini API key
3. Save the file

Example:
```
GEMINI_API_KEY=AIzaSyC1234567890abcdefghijklmnopqrstuvwxyz
```

Get your API key here: https://makersuite.google.com/app/apikey

## Step 2: Run the Application

Simply run:
```bash
python app.py
```

Or if using virtual environment:
```bash
.\venv\Scripts\python.exe app.py
```

You should see:
```
🚀 Starting Intern Communication AI System...
📍 Server running at: http://127.0.0.1:8000
📖 Open your browser and navigate to the URL above
⚠️  Make sure your GEMINI_API_KEY is set in the .env file

Press CTRL+C to stop the server
```

## Step 3: Open in Browser

Navigate to: **http://127.0.0.1:8000**

## Step 4: Upload and Analyze

1. **Drag & drop** your Excel file or click "Browse Files"
2. Enter an intern name (or type "overall" for all interns)
3. Click **"Generate AI Report"**
4. View your beautiful AI-powered analysis!

## Sample File

A sample Excel file `sample_intern_scores.xlsx` is included for testing.

## Troubleshooting

### Missing Dependencies
If you get module errors, install:
```bash
pip install fastapi uvicorn python-multipart pandas openpyxl google-generativeai python-dotenv
```

### API Key Error
Make sure your `.env` file has the correct API key without quotes:
```
GEMINI_API_KEY=your_actual_key_here
```

### Port Already in Use
If port 8000 is busy, edit `app.py` line 199 and change the port number.

---

## What's New ✨

- **Simple Command**: Just run `python app.py` - no need for uvicorn commands!
- **Markdown Support**: AI responses with **bold text** are now properly formatted
- **Beautiful UI**: Modern design with gradients, animations, and smooth transitions
- **Responsive**: Works on desktop, tablet, and mobile devices

Enjoy your AI-powered communication analysis system! 🎉
