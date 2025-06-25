# BeyondWords Speech Analysis

A full-stack speech analysis application with AI-powered accent coaching, built with React, Express, MongoDB, and Python.

## 🏗️ Architecture

The application consists of three main components:

1. **React Frontend** (`client/`) - Modern UI with speech recording and chat interface
2. **Express Backend** (`server/`) - Node.js API with Google OAuth and file handling
3. **Python API** (`python_api.py`) - Speech analysis with Whisper and Wav2Vec2

## 🚀 Quick Start

### Prerequisites

- Node.js (v16+)
- Python (3.8+)
- MongoDB (local or cloud)
- Google OAuth credentials

### 1. Install Dependencies

```bash
# Install Python dependencies
pip install -r requirements.txt

# Install Express server dependencies
cd server
npm install

# Install React client dependencies
cd ../client
npm install
```

### 2. Set Up Environment Variables

Create a `.env` file in the `server/` directory:

```env
MONGODB_URI=mongodb://localhost:27017/beyondwords_speech
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
SESSION_SECRET=your_session_secret
PYTHON_API_URL=http://localhost:5000
```

### 3. Set Up Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URIs:
   - `http://localhost:3000`
   - `http://localhost:4000/auth/google/callback`
6. Copy Client ID and Client Secret to your `.env` file

### 4. Update React Client ID

In `client/src/App.js`, replace `YOUR_GOOGLE_CLIENT_ID` with your actual Google Client ID.

### 5. Start All Services

```bash
# Option 1: Use the startup script (recommended)
./start_services.sh

# Option 2: Start manually in separate terminals
# Terminal 1: Python API
python python_api.py

# Terminal 2: Express Server
cd server && npm start

# Terminal 3: React Client
cd client && npm start
```

## 🎯 Features

### Speech Analysis UI
- **Real-time Recording**: Click to start/stop audio recording
- **Chat Interface**: See your speech transcribed and get AI feedback
- **Detailed Analysis**: Request comprehensive pronunciation feedback
- **Responsive Design**: Works on desktop and mobile

### Backend Integration
- **File Upload**: Secure audio file handling with multer
- **Google OAuth**: Secure authentication
- **Database Storage**: MongoDB for session history
- **Python API Integration**: Seamless communication with speech analysis

### Speech Analysis Pipeline
- **Whisper Transcription**: Accurate speech-to-text conversion
- **Wav2Vec2 Analysis**: Advanced pronunciation analysis
- **AI Feedback**: Personalized coaching recommendations
- **Offline Mode**: Graceful fallback when Python API is unavailable

## 📁 Project Structure

```
beyondwords_speech_analysis/
├── client/                 # React frontend
│   ├── src/
│   │   ├── App.js         # Main application component
│   │   └── index.js       # React entry point
│   ├── public/
│   │   └── index.html     # HTML template
│   └── package.json       # React dependencies
├── server/                # Express backend
│   ├── index.js          # Main server file
│   ├── package.json      # Express dependencies
│   └── uploads/          # Audio file storage
├── python_api.py         # Python speech analysis API
├── requirements.txt      # Python dependencies
├── start_services.sh     # Service startup script
└── README.md            # This file
```

## 🔧 API Endpoints

### Express Server (Port 4000)
- `POST /api/analyze` - Upload and analyze audio
- `POST /api/feedback` - Get detailed feedback
- `GET /api/user` - Get current user info
- `POST /auth/google/token` - Google OAuth verification

### Python API (Port 5000)
- `POST /transcribe` - Transcribe audio with Whisper
- `POST /analyze` - Analyze speech with Wav2Vec2
- `POST /feedback` - Generate detailed feedback
- `GET /health` - Health check

## 🎨 UI Features

### Color Scheme
- Primary: `#8d6748` (Brown)
- Secondary: `#e2c799` (Gold)
- Background: `#f7f3ef` (Light cream)
- Text: `#5c4322` (Dark brown)

### Components
- **Navigation Bar**: Consistent across all pages
- **Landing Page**: Hero section with call-to-action
- **Analyze Page**: Split-screen chat and feedback interface
- **Recording Controls**: Circular button with visual feedback

## 🔒 Security Features

- **CORS Protection**: Configured for local development
- **File Upload Limits**: 10MB max file size
- **Audio File Validation**: Only WAV/WebM files accepted
- **Google OAuth**: Secure authentication flow
- **Session Management**: Express sessions with MongoDB

## 🐛 Troubleshooting

### Common Issues

1. **Python API Not Starting**
   - Check if all dependencies are installed: `pip install -r requirements.txt`
   - Ensure port 5000 is available
   - Check for model download issues

2. **Express Server Errors**
   - Verify MongoDB is running
   - Check environment variables in `.env`
   - Ensure port 4000 is available

3. **React Client Issues**
   - Clear npm cache: `npm cache clean --force`
   - Delete node_modules and reinstall: `rm -rf node_modules && npm install`
   - Check for port 3000 conflicts

4. **Audio Recording Problems**
   - Ensure microphone permissions are granted
   - Try different browsers (Chrome recommended)
   - Check browser console for errors

### Debug Mode

To run in debug mode, set environment variables:
```bash
export DEBUG=*
export NODE_ENV=development
```

## 🚀 Deployment

### Production Setup

1. **Environment Variables**: Update all URLs to production domains
2. **MongoDB**: Use MongoDB Atlas or production MongoDB instance
3. **File Storage**: Consider cloud storage (AWS S3, Google Cloud Storage)
4. **HTTPS**: Enable SSL certificates
5. **Process Management**: Use PM2 or similar for Node.js processes

### Docker Deployment

```dockerfile
# Example Dockerfile for Python API
FROM python:3.9-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY python_api.py .
EXPOSE 5000
CMD ["python", "python_api.py"]
```

## 📈 Future Enhancements

- [ ] Real-time speech analysis
- [ ] Advanced pronunciation scoring
- [ ] User progress tracking
- [ ] Multiple language support
- [ ] Video analysis integration
- [ ] Mobile app development

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details. 