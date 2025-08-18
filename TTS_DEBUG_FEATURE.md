# TTS Debug Feature

## Overview

The TTS Debug Feature provides comprehensive visibility into which Text-to-Speech service is being used and why. This helps administrators and developers understand the TTS service selection logic, fallback behavior, and cost implications.

## Features

### 🔍 **Real-time Service Detection**
- Shows which TTS service is currently active
- Displays service selection logic and fallback reasons
- Provides cost estimates for each service

### 🎯 **Visual Debug Panel**
- Floating debug panel in the web app
- Color-coded service indicators
- Real-time updates with timestamps
- Non-intrusive design that can be dismissed

### 📊 **Comprehensive Logging**
- Detailed console logging with emoji indicators
- Request tracking with unique IDs
- Service availability status
- Error tracking and fallback reasons

## TTS Service Hierarchy

The system follows this priority order:

1. **🖥️ System TTS (FREE)** - Uses built-in system voices
2. **☁️ Google Cloud TTS (CHEAP)** - ~$0.004 per 1K characters
3. **🤖 Gemini TTS (EXPENSIVE)** - ~$0.015 per 1K characters
4. **🔇 Fallback Audio** - Silence file when all else fails

## Implementation Details

### Frontend (React/Next.js)

**Location**: `client-next/app/analyze/page.tsx`

**Key Components**:
- `generateTTSForText()` - Enhanced with debug logging
- `ttsDebugInfo` state - Stores debug information
- Visual debug panel - Floating UI component

**Debug Panel Features**:
- Service indicator with emoji and color coding
- Cost display (green for free, orange for paid)
- Fallback reason explanation
- Last update timestamp
- Dismissible interface

### Backend (Node.js)

**Location**: `server/index.ts`

**Key Components**:
- `generateTTSWithDebug()` - Enhanced TTS function
- `/api/tts-test` endpoint - Returns debug information
- Health check integration

**Debug Information**:
- Service used
- Fallback reason
- Admin settings
- Cost estimate
- Request ID
- Python API debug data

### Python API

**Location**: `python_api.py`

**Key Components**:
- `/generate_tts` endpoint - Enhanced response format
- Debug information extraction
- Legacy format fallback support

### TTS Synthesizer

**Location**: `tts_synthesizer_admin_controlled.py`

**Key Components**:
- `synthesize_speech()` - Returns dict with debug info
- Service selection logic
- Cost tracking
- Request ID generation

## Debug Information Structure

```json
{
  "success": true,
  "output_path": "/path/to/audio.wav",
  "service_used": "system|google_cloud|gemini|fallback|cached",
  "fallback_reason": "none|service_failed|not_available|admin_disabled",
  "admin_settings": {
    "active_tts": "system|cloud|gemini",
    "google_api_enabled": true
  },
  "cost_estimate": "0.00|0.004|0.015",
  "request_id": "timestamp_hash",
  "debug": {
    "legacy_format": false,
    "python_debug": {...}
  }
}
```

## Usage Examples

### Console Logging

When TTS is generated, you'll see detailed console output:

```
🎯 [TTS DEBUG] Generating TTS for text: "Hello, this is a test message..." (35 chars)
🎯 [TTS DEBUG] Language: en, Cache key: ai_message_1234567890
🎯 [TTS DEBUG] Calling Node.js server at: http://localhost:4000/api/tts-test
🎯 [TTS DEBUG] Node.js server response: {success: true, ttsUrl: "/uploads/tts_1234567890.wav", ...}
🎯 [TTS DEBUG] 🖥️ Using: System TTS (FREE)
🎯 [TTS DEBUG] Estimated cost: $0.00
🎯 [TTS DEBUG] TTS generated successfully: /uploads/tts_1234567890.wav
```

### Visual Debug Panel

The debug panel shows:
- **Service**: 🖥️ System (FREE) / ☁️ Google Cloud (CHEAP) / 🤖 Gemini (EXPENSIVE)
- **Cost**: $0.00 (green) / $0.004 (orange) / $0.015 (orange)
- **Reason**: Fallback explanation if applicable
- **Updated**: Timestamp of last TTS generation

## Testing

### Manual Testing

1. Start the application:
   ```bash
   # Terminal 1: Python API
   cd /path/to/project
   python python_api.py
   
   # Terminal 2: Node.js Server
   cd server
   npm start
   
   # Terminal 3: Next.js Frontend
   cd client-next
   npm run dev
   ```

2. Navigate to the analyze page
3. Generate TTS (record audio or click TTS buttons)
4. Check console for debug logs
5. Look for the floating debug panel

### Automated Testing

Run the test script:
```bash
python test_tts_debug.py
```

This will test multiple languages and verify debug information is returned correctly.

## Configuration

### Admin Dashboard

The TTS service selection can be controlled via the admin dashboard:

1. Navigate to `/admin`
2. Go to "TTS System Selection" section
3. Choose between:
   - 🎤 System TTS (FREE)
   - ☁️ Google Cloud (CHEAP)
   - 🤖 Gemini (EXPENSIVE)

### Environment Variables

Ensure these are set for full functionality:
- `GOOGLE_AI_API_KEY` - For Google Cloud and Gemini TTS
- `PYTHON_API_URL` - Python API endpoint (default: http://localhost:5000)

## Troubleshooting

### Common Issues

1. **No debug panel appears**
   - Check browser console for errors
   - Verify TTS generation is working
   - Ensure `ttsDebugInfo` state is being set

2. **Debug info shows "unknown"**
   - Check Python API is running
   - Verify admin settings are configured
   - Check network connectivity

3. **Fallback audio being used**
   - Check admin dashboard settings
   - Verify API keys are valid
   - Check service availability

### Debug Commands

Add these to your browser console for debugging:

```javascript
// Check TTS debug state
console.log('TTS Debug Info:', window.ttsDebugInfo);

// Force debug panel display
window.setTtsDebugInfo({
  serviceUsed: 'test',
  fallbackReason: 'test',
  costEstimate: '0.00',
  adminSettings: {},
  lastUpdate: new Date()
});
```

## Performance Considerations

- Debug information is cached for 5 minutes
- Visual panel only appears when TTS is generated
- Console logging is optimized for production
- Debug panel can be dismissed to reduce UI clutter

## Future Enhancements

- [ ] Historical TTS usage tracking
- [ ] Cost analytics dashboard
- [ ] Service performance metrics
- [ ] Automatic service switching based on performance
- [ ] User preference overrides
- [ ] Batch TTS generation with debug info

## Contributing

When adding new TTS services:

1. Update the service hierarchy in `tts_synthesizer_admin_controlled.py`
2. Add service emoji and name mappings in the frontend
3. Update cost estimation logic
4. Add appropriate debug information
5. Update this documentation

## Support

For issues or questions about the TTS debug feature:

1. Check the console logs for detailed error information
2. Verify all services are properly configured
3. Test with the provided test script
4. Review the admin dashboard settings

