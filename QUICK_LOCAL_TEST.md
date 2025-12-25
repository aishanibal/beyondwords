# Quick Local Testing Setup (No Authentication)

This guide shows you how to test the application locally **without Supabase authentication**.

## ⚡ Quick Start

### Step 1: Set Environment Variables

**Client** (`beyondwords/client-next/.env.local`):
```bash
# Development mode - bypass authentication
NEXT_PUBLIC_BYPASS_AUTH=true
NODE_ENV=development

# Backend API URLs (local)
BACKEND_URL=http://localhost:4000
NEXT_PUBLIC_BACKEND_URL=http://localhost:4000
NEXT_PUBLIC_API_BASE_URL=http://localhost:4000

# AI/Transcription services
AI_BACKEND_URL=http://localhost:5000
NEXT_PUBLIC_PYTHON_API_URL=http://localhost:5000

# Supabase (NOT NEEDED when bypassing auth - will use mock client)
# NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
# NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

**Server** (`beyondwords/server/.env`):
```bash
# Development mode - bypass JWT authentication
BYPASS_AUTH=true
NODE_ENV=development

# Python API URL
PYTHON_API_URL=http://localhost:5000

# Server Configuration
PORT=4000

# JWT Secret (still needed, but won't be used in bypass mode)
JWT_SECRET=dev_secret_key

# Supabase (NOT NEEDED when bypassing auth)
# SUPABASE_URL=your_supabase_url
# SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### Step 2: Start Services

**Terminal 1 - Python API:**
```bash
cd beyondwords
export GOOGLE_API_KEY=your_google_api_key_here
python python_api.py
```

**Terminal 2 - Express Server:**
```bash
cd beyondwords/server
npm run dev
```

**Terminal 3 - Next.js Client:**
```bash
cd beyondwords/client-next
npm run dev
```

### Step 3: Access the App

Open http://localhost:3000

You should now be able to:
- ✅ Access all pages without login
- ✅ Use the analyze page
- ✅ Access the dashboard
- ✅ Test all functionality

## What Happens in Bypass Mode

### Client Side:
- Creates a **mock Supabase client** (no real Supabase credentials needed!)
- Creates a mock user: `dev-user-123` with email `dev@localhost.test`
- Skips all Supabase authentication checks
- Allows access to protected pages
- All Supabase functions return mock data

### Server Side:
- Skips JWT token validation
- Creates a mock user object for all requests
- All API endpoints work without authentication

### Important Notes:
- **No Supabase credentials required** - the app uses a mock client
- Data won't persist (conversations, profiles, etc. are in-memory only)
- Perfect for testing UI and functionality without database setup

## ⚠️ Important Warnings

1. **NEVER enable this in production!** The bypass only works when:
   - `NODE_ENV=development`
   - `BYPASS_AUTH=true` or `NEXT_PUBLIC_BYPASS_AUTH=true`

2. **Security**: This completely disables authentication. Only use for local testing.

3. **Database**: The app uses a mock Supabase client when bypassing auth. Core functionality works, but data won't persist (conversations, user profiles, etc. won't be saved to database).

## Testing Checklist

- [ ] Homepage loads
- [ ] Can navigate to /analyze page
- [ ] Can navigate to /dashboard
- [ ] Can record audio
- [ ] Can get transcriptions
- [ ] Can get AI responses
- [ ] TTS works
- [ ] Conversations can be created

## Troubleshooting

### "Authentication required" errors
- Make sure `NEXT_PUBLIC_BYPASS_AUTH=true` is set in `.env.local`
- Restart the Next.js dev server after changing env vars

### "No token provided" errors from server
- Make sure `BYPASS_AUTH=true` is set in `server/.env`
- Restart the Express server after changing env vars

### Pages still redirecting to login
- Check browser console for errors
- Verify environment variables are loaded (restart dev servers)
- Clear browser cache/localStorage

## Disabling Bypass Mode

To test with real authentication:
1. Remove or comment out `BYPASS_AUTH=true` and `NEXT_PUBLIC_BYPASS_AUTH=true`
2. Set up proper Supabase credentials
3. Restart all services

