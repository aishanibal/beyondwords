# Python API Deployment Guide

This guide will help you deploy the Python Flask API (port 5000) to Render.

## **What this API includes:**
- 🤖 **Gemini AI Integration** - Transcription, feedback, suggestions
- 🔊 **TTS (Text-to-Speech)** - Google Cloud TTS and Gemini TTS
- ⚙️ **Admin Dashboard** - Control TTS settings and features
- 🔧 **Feature Toggles** - Enable/disable Gemini, Google APIs, etc.

## **Deployment Steps:**

### 1. **Create a new Render service**
```bash
# Go to Render dashboard
# Click "New +" → "Web Service"
# Connect your GitHub repository
```

### 2. **Configure the service:**
- **Name:** `heirloom-python-api`
- **Environment:** `Python 3`
- **Build Command:** `pip install -r requirements.txt`
- **Start Command:** `gunicorn python_api:app --bind 0.0.0.0:$PORT`

### 3. **Set Environment Variables:**
```
GOOGLE_API_KEY=your_google_api_key
GOOGLE_CLOUD_PROJECT=your_project_id
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

### 4. **Deploy using render.yaml (Alternative):**
```bash
# If you have render CLI installed
render deploy --file render-python.yaml
```

## **Admin Dashboard Access:**

Once deployed, your admin dashboard will be available at:
```
https://your-service-name.onrender.com/admin
```

**Default credentials:**
- Username: `admin`
- Password: `admin123`

## **Admin Dashboard Features:**

### 🔧 **TTS Settings**
- Switch between System TTS, Google Cloud TTS, or Gemini TTS
- Set cost limits and usage tracking
- Configure voice models

### 🎛️ **Feature Toggles**
- Enable/disable Gemini AI
- Enable/disable Google Cloud TTS
- Enable/disable Google AI services
- Master toggle for all Google APIs

### 📊 **Usage Analytics**
- Track daily usage
- Monitor costs
- View system status

### 🔐 **Security**
- Change admin password
- Reset usage statistics
- System monitoring

## **API Endpoints:**

### **Core AI Endpoints:**
- `POST /transcribe` - Transcribe audio
- `POST /ai_response` - Get AI response
- `POST /analyze` - Analyze speech
- `POST /feedback` - Get detailed feedback
- `POST /suggestions` - Get text suggestions

### **TTS Endpoints:**
- `POST /generate_tts` - Generate speech
- `POST /quick_translation` - Quick translation

### **Admin Endpoints:**
- `GET /admin` - Admin dashboard
- `POST /admin/api/enable_gemini` - Enable Gemini
- `POST /admin/api/disable_gemini` - Disable Gemini
- `POST /admin/api/update_settings` - Update TTS settings

## **Integration with Frontend:**

Update your frontend to call the Python API for:
- Audio transcription
- TTS generation
- AI responses
- Admin features

## **Troubleshooting:**

### **Common Issues:**
1. **Port conflicts** - Ensure port 5000 is available
2. **Missing dependencies** - Check requirements.txt
3. **API key issues** - Verify Google API key is set
4. **CORS errors** - CORS is already configured in the API

### **Check Logs:**
```bash
# In Render dashboard
# Go to your service → Logs
# Look for any error messages
```

## **Local Development:**

```bash
# Install dependencies
pip install -r requirements.txt

# Run locally
python python_api.py

# Access admin dashboard
# http://localhost:5000/admin
```

## **Next Steps:**

1. Deploy the Python API to Render
2. Update your frontend to use the new Python API endpoints
3. Configure the admin dashboard settings
4. Test all features (TTS, transcription, AI responses)
5. Set up proper admin credentials

---

**Need help?** Check the logs in your Render dashboard or refer to the `GOOGLE_API_TOGGLE_FEATURE.md` file for detailed feature documentation. 