# Gemini Integration Setup Guide

This guide will help you set up the BeyondWords speech analysis app with Google's Gemini AI instead of Ollama.

## Prerequisites

1. **Python 3.8+** installed
2. **Node.js 16+** installed
3. **Google AI API Key** (free tier available)

## Step 1: Get Google AI API Key

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the API key (starts with `AIza...`)

## Step 2: Set Environment Variables

Set your Google API key as an environment variable:

```bash
export GOOGLE_API_KEY="your-api-key-here"
```

For permanent setup, add this to your shell profile (`.bashrc`, `.zshrc`, etc.):

```bash
echo 'export GOOGLE_API_KEY="your-api-key-here"' >> ~/.bashrc
source ~/.bashrc
```

## Step 3: Install Python Dependencies

```bash
pip install -r requirements.txt
```

## Step 4: Test Gemini Integration

Run the test script to verify everything is working:

```bash
python test_gemini.py
```

You should see:
```
🧪 Testing Gemini Integration
==================================================
🔍 Testing Gemini API health...
✅ Gemini API is ready!

🗣️ Testing conversational response...
✅ English response: [response text]
✅ Spanish response: [response text]
✅ Tagalog response: [response text]

📊 Testing detailed feedback...
✅ Detailed feedback: [feedback text]

🇵🇭 Testing Filipino heritage tutor...
✅ Filipino tutor response: [response text]

🎉 All tests passed! Gemini integration is working correctly.
```

## Step 5: Install Node.js Dependencies

```bash
# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

## Step 6: Run the Application

### Option 1: Development Mode (Recommended)

1. **Start the Python API** (Terminal 1):
```bash
python python_api.py
```

2. **Start the Node.js server** (Terminal 2):
```bash
cd server
npm start
```

3. **Start the React client** (Terminal 3):
```bash
cd client
npm start
```

### Option 2: Production Mode

1. **Build the client**:
```bash
cd client
npm run build
```

2. **Start the server** (serves the built client):
```bash
cd server
npm start
```

3. **Start the Python API**:
```bash
python python_api.py
```

## Step 7: Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001
- **Python API**: http://localhost:5001

## Features

### 🗣️ Speech Analysis
- **Real-time transcription** using Whisper
- **Pronunciation analysis** using Wav2Vec2
- **Conversational AI responses** using Gemini
- **Detailed feedback** with phoneme-level analysis

### 🌍 Multi-language Support
- **English** (en)
- **Spanish** (es)
- **Hindi** (hi)
- **Japanese** (ja)
- **Tagalog/Filipino** (tl) - Special heritage language tutor

### 🇵🇭 Filipino Heritage Language Tutor
The app includes a specialized Filipino tutor that:
- Provides natural Tagalog conversation
- Corrects grammar and pronunciation
- Explains language concepts in English
- Suggests follow-up responses
- Maintains conversation context

## Usage

1. **Record Speech**: Click the microphone button and speak
2. **Get Transcription**: Your speech is transcribed in real-time
3. **Receive AI Response**: Gemini provides conversational feedback
4. **Detailed Analysis**: Click "Get Detailed Feedback" for pronunciation analysis
5. **Practice**: Continue the conversation to improve your skills

## Troubleshooting

### API Key Issues
```bash
# Check if API key is set
echo $GOOGLE_API_KEY

# If empty, set it again
export GOOGLE_API_KEY="your-api-key-here"
```

### Port Conflicts
If ports are already in use:
- Python API: Change port in `python_api.py` (line 310)
- Node.js server: Change port in `server/index.js` (line 741)
- React client: Change port in `client/package.json`

### Dependencies Issues
```bash
# Reinstall Python dependencies
pip install -r requirements.txt --force-reinstall

# Reinstall Node.js dependencies
cd server && rm -rf node_modules && npm install
cd ../client && rm -rf node_modules && npm install
```

### Audio Issues
- Ensure microphone permissions are granted
- Try different browsers (Chrome recommended)
- Check system audio settings

## Cost Considerations

- **Google AI API**: Free tier includes 15 requests/minute
- **Whisper**: Free (runs locally)
- **Wav2Vec2**: Free (runs locally)

For production use, consider:
- Upgrading to Google AI paid tier
- Implementing request caching
- Adding rate limiting

## Support

If you encounter issues:
1. Check the console logs in your browser
2. Check the terminal output for each service
3. Run `python test_gemini.py` to verify Gemini integration
4. Ensure all environment variables are set correctly

## Next Steps

- Customize the Filipino tutor prompts in `gemini_client.py`
- Add more languages by extending the language support
- Implement user authentication and session storage
- Add progress tracking and learning analytics 