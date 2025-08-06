# Google API Toggle Feature

## Overview

The Google API Toggle feature allows administrators to enable or disable all Google API services (Gemini AI, Google Cloud TTS, Google AI) through the admin dashboard. This provides a master switch to control API usage and costs.

## Features

### **Master Toggle Control**
- **Location**: Admin Dashboard → Google API Services Control section
- **Function**: Master switch to enable/disable all Google API services
- **Default State**: Enabled (true)

### **Affected Services**
When Google API services are disabled, the following services are affected:

1. **Gemini AI Services**:
   - Conversational responses
   - Detailed feedback
   - Text suggestions
   - Short feedback
   - Translation services
   - Conversation summaries
   - Detailed breakdowns
   - Quick translations

2. **Google Cloud TTS**:
   - Text-to-speech synthesis
   - Voice generation

3. **Google AI Services**:
   - All Gemini-based AI interactions

### **Fallback Behavior**
When Google API services are disabled:
- **AI Functions**: Return error messages indicating services are disabled
- **TTS**: Automatically falls back to System TTS (free)
- **User Experience**: Users see clear messages about disabled services

## Implementation Details

### **Admin Dashboard Integration**
- New `google_api_settings` section in admin configuration
- `services_enabled` boolean flag controls all Google APIs
- Toggle switch in admin dashboard UI
- Real-time status display

### **API Endpoints**
- `POST /admin/api/toggle_google_api`: Toggle Google API services
- Requires admin authentication
- Accepts `enabled` boolean parameter

### **Configuration File**
```json
{
  "google_api_settings": {
    "services_enabled": true,
    "gemini_enabled": false,
    "google_cloud_tts_enabled": true,
    "google_ai_enabled": true
  }
}
```

### **Function Integration**
All Google API functions now check `is_google_api_enabled()` before making API calls:

```python
def is_google_api_enabled() -> bool:
    """Check if Google API services are enabled via admin dashboard"""
    try:
        from admin_dashboard import AdminDashboard
        dashboard = AdminDashboard()
        return dashboard.is_google_api_enabled()
    except Exception as e:
        print(f"⚠️ Error checking Google API status: {e}")
        return True  # Default to enabled if we can't check
```

## Usage Instructions

### **For Administrators**

1. **Access Admin Dashboard**:
   - Navigate to `http://localhost:5000/admin`
   - Login with admin credentials

2. **Toggle Google API Services**:
   - Find the "Google API Services Control" section
   - Use the toggle switch to enable/disable services
   - Status will update immediately

3. **Monitor Status**:
   - Check the status indicator below the toggle
   - View system status for current configuration

### **For Developers**

1. **Check API Status**:
   ```python
   from admin_dashboard import AdminDashboard
   dashboard = AdminDashboard()
   is_enabled = dashboard.is_google_api_enabled()
   ```

2. **Test Toggle Functionality**:
   ```bash
   python test_google_api_toggle.py
   ```

## Benefits

### **Cost Control**
- Prevent unexpected API usage during development
- Control costs during deployment
- Easy on/off switch for testing

### **Deployment Safety**
- Disable APIs before deployment to prevent charges
- Enable only when needed for production
- Safe testing environment

### **User Experience**
- Clear error messages when services are disabled
- Automatic fallback to free alternatives
- No application crashes when APIs are disabled

## Error Messages

When Google API services are disabled, users will see messages like:
- "Google API services are currently disabled. Please enable them in the admin dashboard."
- "Google API services are disabled. Using System TTS only."

## Testing

Run the test script to verify functionality:
```bash
python test_google_api_toggle.py
```

This will test:
- Toggle functionality
- Function behavior when disabled
- TTS fallback behavior
- System status updates

## Security

- Toggle requires admin authentication
- Default password protection
- Secure API endpoint with session validation
- No direct access to toggle without admin login

## Future Enhancements

- Individual service toggles (Gemini, Google Cloud TTS, etc.)
- Usage analytics when services are disabled
- Automatic cost monitoring
- Scheduled enable/disable times
- Email notifications for toggle changes 