# Google Cloud Text-to-Speech API Setup

## **Issue**
The Google Cloud TTS API is not enabled in your Google Cloud project, which is why you're getting a 403 error when trying to use it from the admin panel.

## **Solution**

### **Step 1: Enable the Text-to-Speech API**

1. **Visit the Google Cloud Console**:
   - Go to: https://console.developers.google.com/apis/api/texttospeech.googleapis.com/overview?project=1018295957626
   - Or navigate to: Google Cloud Console → APIs & Services → Library → Search for "Text-to-Speech API"

2. **Enable the API**:
   - Click on "Text-to-Speech API"
   - Click the "Enable" button
   - Wait a few minutes for the changes to propagate

### **Step 2: Verify API Key Permissions**

Make sure your API key has access to the Text-to-Speech API:

1. **Go to Google Cloud Console**:
   - Navigate to: APIs & Services → Credentials
   - Find your API key (starts with `AIzaSyCL...`)

2. **Check API restrictions**:
   - Click on your API key
   - Under "API restrictions", make sure "Text-to-Speech API" is included
   - Or set it to "Don't restrict key" for testing

### **Step 3: Test the Integration**

After enabling the API, test it with:

```bash
python test_google_cloud_tts_admin.py
```

### **Step 4: Admin Panel Usage**

Once the API is enabled, you can use the admin panel to switch between TTS systems:

1. **Access Admin Panel**: http://localhost:5000/admin
2. **Login**: Use password `admin123`
3. **TTS System Selection**: Click the "☁️ Google Cloud (CHEAP)" button
4. **Test**: The system will now use Google Cloud TTS for all users

## **Current Status**

✅ **Admin Panel Integration**: Working correctly  
✅ **TTS System Switching**: Working correctly  
✅ **Google Cloud TTS Code**: Working correctly  
❌ **Google Cloud TTS API**: Not enabled (needs to be enabled in Google Cloud Console)

## **Expected Behavior After Setup**

Once the API is enabled:

1. **Admin Panel**: Click "☁️ Google Cloud (CHEAP)" button
2. **System Response**: Shows "TTS system changed to CLOUD!"
3. **TTS Generation**: Uses Google Cloud TTS for all speech synthesis
4. **Cost Tracking**: Automatically tracks usage and costs
5. **Fallback**: Falls back to System TTS if Google Cloud TTS fails

## **Cost Information**

- **Google Cloud TTS**: ~$0.004 per 1K characters (very cheap)
- **System TTS**: Free
- **Gemini TTS**: ~$0.015 per 1K characters (expensive)

## **Troubleshooting**

If you still get errors after enabling the API:

1. **Wait 5-10 minutes** for API changes to propagate
2. **Check API key restrictions** in Google Cloud Console
3. **Verify billing is enabled** for your Google Cloud project
4. **Test with a simple API call** to confirm the API is working

## **Next Steps**

1. Enable the Text-to-Speech API in Google Cloud Console
2. Test the integration with the provided test script
3. Use the admin panel to switch to Google Cloud TTS
4. Monitor usage and costs through the admin dashboard 