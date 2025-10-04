# TTS Deployment Configuration

## Overview

The TTS system is designed to work across different deployment environments. This document explains how to configure it properly for production deployment.

## Architecture

- **Frontend**: Next.js on Vercel
- **Backend**: Node.js/Express on Render
- **TTS Files**: Served from backend `/files` endpoint

## Environment Variables

### Required Environment Variables

Set these in your Vercel deployment settings:

```bash
# Backend API URL (where TTS files are served from)
NEXT_PUBLIC_API_BASE_URL=https://beyondwords-express.onrender.com

# Alternative name (for backward compatibility)
NEXT_PUBLIC_BACKEND_URL=https://beyondwords-express.onrender.com
```

### Optional Environment Variables

```bash
# Supabase configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Google OAuth
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id
```

## How TTS URL Resolution Works

### 1. Priority Order

The system determines the backend URL in this order:

1. **Environment Variables** (highest priority)
   - `NEXT_PUBLIC_API_BASE_URL`
   - `NEXT_PUBLIC_BACKEND_URL`

2. **Auto-detection** (fallback)
   - Vercel domains → Render backend
   - Localhost → Render backend
   - Other domains → Same origin

3. **Default Fallback**
   - `https://beyondwords-express.onrender.com`

### 2. URL Construction

```typescript
// Relative URL from database
const ttsUrl = "/files/tts_1759590458539.wav";

// Gets converted to absolute URL
const absoluteUrl = "https://beyondwords-express.onrender.com/files/tts_1759590458539.wav";
```

## Deployment Steps

### 1. Vercel Configuration

1. Go to your Vercel project settings
2. Navigate to "Environment Variables"
3. Add the following variables:

```
NEXT_PUBLIC_API_BASE_URL = https://beyondwords-express.onrender.com
```

### 2. Backend CORS Configuration

Your backend (Render) already has CORS configured correctly:

```javascript
// In your Express server (already configured)
app.use(cors({ 
  origin: [
    'http://localhost:3000',
    'https://speakbeyondwords-sigma.vercel.app',
    'https://speakbeyondwords-sigma.vercel.app/',
    'https://speakbeyondwords-sigma.vercel.app/*'
  ], 
  credentials: false,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin']
}));
```

**Note**: The `/files` endpoint now has proper CORS headers for TTS file serving.

### 3. File Serving Configuration

Ensure your backend serves TTS files correctly:

```javascript
// Serve TTS files
app.use('/files', express.static(path.join(__dirname, '..')));
```

## Testing

### 1. Development Testing

```bash
# Start frontend
npm run dev

# Check console logs for TTS URL construction
# Should see: "Constructed absolute URL: http://localhost:4000/files/..."
```

### 2. Production Testing

1. Deploy to Vercel
2. Check browser console for TTS URL construction
3. Verify TTS files are accessible from the constructed URLs

## Troubleshooting

### Common Issues

1. **CORS Errors**
   - ✅ **Fixed**: Backend CORS is properly configured for `speakbeyondwords-sigma.vercel.app`
   - ✅ **Fixed**: `/files` endpoint now has CORS headers

2. **404 Errors for TTS Files**
   - Verify backend is serving files from `/files` endpoint
   - Check file permissions on the server
   - Ensure TTS files are being generated correctly

3. **Environment Variables Not Working**
   - Ensure variables start with `NEXT_PUBLIC_`
   - Redeploy after adding new environment variables
   - Check browser console for environment variable values

4. **TTS URL Construction Issues**
   - Check browser console for `🔍 [TTS_CONFIG]` logs
   - Verify the constructed URL is correct
   - Test URL accessibility manually

### Debug Information

The system logs detailed information to help debug issues:

```javascript
console.log('🔍 [EXISTING_TTS] Environment check:', {
  NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL,
  NEXT_PUBLIC_BACKEND_URL: process.env.NEXT_PUBLIC_BACKEND_URL,
  currentOrigin: window.location.origin
});
```

## Fallback Behavior

If existing TTS files are not accessible, the system will:

1. Log the error
2. Fall back to generating new TTS (if text is available)
3. Continue gracefully without breaking the user experience

This ensures the application remains functional even if some TTS files are missing or inaccessible.
