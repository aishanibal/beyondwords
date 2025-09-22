# 🧪 Testing Refactored Code with Production URLs

## **✅ Current Setup**
- ✅ Dev server running on `http://localhost:3000`
- ✅ Production URLs configured (no need to change)
- ✅ Refactored version enabled (`NEXT_PUBLIC_USE_REFACTORED=true`)

## **🎯 Testing Steps**

### **1. Basic Page Load Test**
- [ ] Navigate to `http://localhost:3000/analyze`
- [ ] Page loads without errors
- [ ] Check browser console for errors (F12 → Console)
- [ ] Verify UI components render correctly

### **2. API Connectivity Test**
- [ ] Check Network tab in browser dev tools
- [ ] Verify API calls are going to your production URLs
- [ ] Look for any 404 or 500 errors
- [ ] Check if JWT tokens are being sent correctly

### **3. Core Functionality Test**

#### **Audio Recording:**
- [ ] Click microphone button
- [ ] Browser requests microphone permission
- [ ] Recording starts (button changes to stop)
- [ ] Recording stops when clicked again
- [ ] Check console for audio processing logs

#### **TTS (Text-to-Speech):**
- [ ] Send a message and wait for AI response
- [ ] Click speaker icon on AI messages
- [ ] Audio should play
- [ ] Check Network tab for TTS API calls

#### **Translation:**
- [ ] Click "Translate" button on any message
- [ ] Translation should appear
- [ ] Click "Detailed Breakdown" button
- [ ] Detailed breakdown should appear
- [ ] Check for translation API calls in Network tab

#### **Conversation Management:**
- [ ] Send a few messages
- [ ] Check if messages are saved (look for conversation API calls)
- [ ] Try loading an existing conversation
- [ ] Verify conversation loads correctly

### **4. Production URL Verification**

Check that these APIs are being called with your production URLs:
- [ ] `/api/transcribe_only` → Your production backend
- [ ] `/api/tts` → Your production backend  
- [ ] `/api/translate` → Your production backend
- [ ] `/api/feedback` → Your production backend
- [ ] `/api/conversations` → Your production backend

### **5. Error Monitoring**

Watch for these common issues:
- [ ] **CORS errors** - Cross-origin requests blocked
- [ ] **Authentication errors** - JWT token issues
- [ ] **Network timeouts** - Slow API responses
- [ ] **Missing environment variables** - API keys not found

## **🔍 Debugging Tips**

### **Browser Console Commands**
```javascript
// Check if refactored version is loaded
console.log('Refactored version loaded:', window.location.href.includes('analyze'));

// Check environment variables
console.log('Use refactored:', process.env.NEXT_PUBLIC_USE_REFACTORED);

// Check API base URL
console.log('Backend URL:', process.env.NEXT_PUBLIC_BACKEND_URL);
```

### **Network Tab Analysis**
1. Open Dev Tools (F12)
2. Go to Network tab
3. Filter by "XHR" or "Fetch"
4. Look for failed requests (red status codes)
5. Check request headers for authentication

### **Console Error Patterns**
- `TypeError: Cannot read property...` → Hook state issues
- `Network Error` → API connectivity problems
- `401 Unauthorized` → Authentication issues
- `404 Not Found` → Missing API endpoints

## **✅ Success Criteria**

The refactored version should:
- [ ] Load without JavaScript errors
- [ ] All buttons and interactions work
- [ ] API calls succeed with production URLs
- [ ] Audio recording/playback functions
- [ ] Translations and feedback work
- [ ] No console errors
- [ ] Same functionality as original

## **🚨 If Issues Found**

### **Quick Rollback:**
```bash
# In terminal:
export NEXT_PUBLIC_USE_REFACTORED=false
# Refresh browser
```

### **Common Fixes:**
1. **Missing imports** → Check file paths
2. **Hook state issues** → Verify state management
3. **API errors** → Check production URL configuration
4. **Authentication** → Verify JWT token handling

## **📝 Test Results**

Date: ___________
Tester: ___________

### **Passed Tests:**
- [ ] Page Load
- [ ] API Connectivity  
- [ ] Audio Recording
- [ ] TTS Playback
- [ ] Translation
- [ ] Conversation Management
- [ ] Production URL Usage

### **Failed Tests:**
- [ ] (List any failures)

### **Notes:**
_________________________________
_________________________________
_________________________________
