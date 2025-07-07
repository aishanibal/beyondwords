# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

BeyondWords is an AI-powered heritage language learning platform that helps diaspora communities reconnect with their native languages through real-time speech analysis, conversational AI, and personalized feedback.

## Architecture

This is a **three-service microservices architecture**:

1. **React Frontend** (Port 3000) - User interface and speech recording
2. **Express Backend** (Port 4000) - API, authentication, file handling  
3. **Python API** (Port 5000) - Speech processing with Whisper, Wav2Vec2, and Ollama

### Key Technology Stack
- **Frontend**: React 18, Google OAuth, Supabase, Axios
- **Backend**: Express.js, SQLite3 (dev) / Supabase (prod), JWT, Multer
- **Python**: Flask, Whisper (large model), Wav2Vec2, Ollama, PyTorch

## Development Commands

### Starting All Services
```bash
# Recommended: Start all services with orchestration script
./start_services.sh

# Manual startup (3 separate terminals):
# Terminal 1: Python API
python python_api.py

# Terminal 2: Express Server  
cd server && npm run dev

# Terminal 3: React Client
cd client && npm start
```

### Individual Service Commands
```bash
# Frontend development
cd client && npm start          # Development server
cd client && npm run build      # Production build
cd client && npm test           # Run tests

# Backend development  
cd server && npm run dev        # Development with nodemon
cd server && npm start          # Production start

# Python API
python python_api.py           # Start Flask API on port 5000
pip install -r requirements.txt # Install Python dependencies
```

### Deployment Commands
```bash
# Frontend deployment to Vercel
cd client && vercel --prod

# Backend deployment to Fly.io
cd server && fly deploy

# Using deployment scripts
./deploy-frontend.sh           # Deploy React to Vercel
./deploy-backend.sh            # Deploy Express to Fly.io
```

## Code Architecture & Key Patterns

### Speech Processing Pipeline
The core feature follows this flow:
1. **Audio Recording** → Frontend captures via browser APIs
2. **File Upload** → Express server receives via Multer (10MB limit, audio-only)
3. **Transcription** → Python API uses Whisper for speech-to-text  
4. **Analysis** → Wav2Vec2 analyzes pronunciation and fluency
5. **AI Response** → Ollama generates conversational feedback
6. **TTS Synthesis** → macOS `say` command generates audio response
7. **Session Storage** → SQLite/Supabase stores chat history

### Authentication Flow
- **Google OAuth** via `@react-oauth/google` in frontend
- **JWT tokens** issued by Express backend, stored in localStorage
- **Session management** persisted in database with user associations

### Database Design
**Development**: SQLite3 with schema in `server/database.js`
**Production**: Supabase PostgreSQL with migration scripts

Key tables:
- `users` - Google OAuth user data
- `chat_sessions` - Conversation history and analysis results  
- `waitlist` - Email collection for landing page

### API Architecture
**RESTful endpoints** with consistent patterns:
- `POST /api/analyze` - Main speech processing endpoint
- `POST /api/feedback` - Detailed pronunciation analysis
- `POST /auth/google/token` - OAuth verification
- `GET /api/user` - Current user session data

### Error Handling & Fallbacks
- **Graceful degradation** when Python API unavailable
- **CORS configuration** for cross-origin development  
- **File validation** with size limits and audio format checks
- **Offline modes** for development without all services running

## Important File Locations

### Core Application Files
- `client/src/App.js` - Main React component with routing and auth context
- `server/index.js` - Express server with all API routes and middleware
- `python_api.py` - Flask API handling speech processing pipeline
- `server/database.js` - SQLite operations and schema definitions

### Configuration Files  
- `client/src/supabase.js` - Supabase client for email collection
- `start_services.sh` - Orchestrated service startup script
- `DEPLOYMENT.md` - Complete production deployment guide
- Environment files: `client/.env`, `server/.env`

### Speech Analysis Components
- `ollama_client.py` - AI conversation and feedback generation
- `tts_synthesizer.py` - Text-to-speech using macOS system commands
- `archive/` - Legacy advanced analysis tools (MFA, OpenSMILE)

## Environment Configuration

### Development Setup
**Frontend** (`client/.env`):
```
REACT_APP_API_URL=http://localhost:4000
REACT_APP_SUPABASE_URL=your_supabase_url
REACT_APP_SUPABASE_ANON_KEY=your_supabase_key
```

**Backend** (`server/.env`):
```
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret  
SESSION_SECRET=your_session_secret
DATABASE_URL=your_database_connection_string
```

### Production Deployment
- **Frontend**: Vercel with environment variables configured
- **Backend**: Fly.io with secrets management (`fly secrets set`)
- **Database**: Supabase PostgreSQL with RLS policies enabled

## Development Patterns

### Service Communication
Services communicate via HTTP APIs with proper error handling:
- React → Express: Axios with authentication headers
- Express → Python: Internal HTTP requests with file forwarding
- All services: CORS-enabled for cross-origin development

### State Management
- **React**: Context API for authentication state
- **Express**: Express sessions with database persistence
- **Python**: Stateless processing with file-based I/O

### File Handling
- **Upload**: Multer in Express with `/uploads` directory
- **Processing**: Temporary files in Python API
- **Storage**: Local filesystem (dev) or cloud storage (prod)

## Common Development Tasks

### Adding New API Endpoints
1. Add route in `server/index.js` with appropriate middleware
2. Add corresponding API call in React components using Axios
3. Update CORS configuration if needed
4. Test with all three services running

### Modifying Speech Analysis
1. Update processing logic in `python_api.py`
2. Modify API calls in `server/index.js` if needed
3. Update frontend UI in `client/src/App.js` analyze section  
4. Test full pipeline from recording to response

### Database Changes
1. Update schema in `server/database.js` for SQLite
2. Create migration scripts for Supabase PostgreSQL
3. Update API endpoints that interact with changed tables
4. Test with both development and production database types

## Testing & Validation

### Service Health Checks
- Python API: `GET http://localhost:5000/health`
- Express Server: `GET http://localhost:4000/api/health` 
- React Client: Browser console for errors and network requests

### Audio Pipeline Testing
1. Record audio in browser interface
2. Check file upload in Express server logs
3. Verify Python API receives and processes audio
4. Confirm TTS audio generation and playback
5. Validate session storage in database

## Security Considerations

- **File uploads** limited to audio formats with size restrictions
- **Google OAuth** with proper token validation and session management
- **CORS** configured for specific origins in production
- **Environment variables** for all sensitive credentials
- **RLS policies** enabled in Supabase for data isolation