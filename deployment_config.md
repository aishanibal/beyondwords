# Deployment Configuration

## Environment Variables for Cloud Transcription

To use Google Cloud Speech-to-Text instead of Whisper in deployment, set this environment variable:

```bash
USE_CLOUD_TRANSCRIPTION=true
```

## Local Development (Default)
- Uses Whisper for transcription
- No environment variable needed
- Models loaded locally

## Deployment Configuration
- Uses Google Cloud Speech-to-Text for transcription
- No models loaded (Whisper or Wav2Vec2) - saves significant memory
- Requires `GOOGLE_API_KEY` environment variable

## Platform-Specific Setup

### Vercel
Add to your environment variables:
```
USE_CLOUD_TRANSCRIPTION=true
GOOGLE_API_KEY=your_google_api_key_here
```

### Railway
Add to your environment variables:
```
USE_CLOUD_TRANSCRIPTION=true
GOOGLE_API_KEY=your_google_api_key_here
```

### Heroku
```bash
heroku config:set USE_CLOUD_TRANSCRIPTION=true
heroku config:set GOOGLE_API_KEY=your_google_api_key_here
```

### Docker
```dockerfile
ENV USE_CLOUD_TRANSCRIPTION=true
ENV GOOGLE_API_KEY=your_google_api_key_here
```

## Benefits of Cloud Transcription in Deployment

1. **No Model Loading** - Saves 2-5GB of memory (Whisper + Wav2Vec2)
2. **Faster Startup** - No model download/loading time
3. **Better Resource Usage** - No CPU/GPU requirements
4. **Consistent Performance** - No cold start issues
5. **Cost Effective** - Pay per use instead of maintaining models

## Fallback Behavior

If `USE_CLOUD_TRANSCRIPTION=true` but no Google API key is available:
- The app will start but transcription will fail
- Health check will show "degraded" status
- Error messages will guide you to set the API key 