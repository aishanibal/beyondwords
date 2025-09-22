# 🧪 Testing Refactored AnalyzeClient Functionality

## **Local Testing Checklist**

### **1. Basic Page Load Test**
- [ ] Navigate to `http://localhost:3000/analyze`
- [ ] Page loads without errors
- [ ] No console errors in browser dev tools
- [ ] UI components render correctly

### **2. Audio Recording Test**
- [ ] Click microphone button
- [ ] Browser requests microphone permission
- [ ] Recording starts (button changes to stop)
- [ ] Recording stops when clicked again
- [ ] Audio blob is generated and processed

### **3. TTS (Text-to-Speech) Test**
- [ ] Click TTS button on any AI message
- [ ] Audio plays correctly
- [ ] No console errors during TTS generation
- [ ] TTS queue works (multiple messages)

### **4. Translation Test**
- [ ] Click "Translate" button on a message
- [ ] Translation appears
- [ ] Click "Detailed Breakdown" button
- [ ] Detailed breakdown appears
- [ ] No API errors in console

### **5. Conversation Management Test**
- [ ] Start a new conversation
- [ ] Send a message
- [ ] Check if message is saved to backend
- [ ] Load an existing conversation
- [ ] Verify conversation loads correctly

### **6. Feedback System Test**
- [ ] Send a message in autospeak mode
- [ ] Check if short feedback appears
- [ ] Click "Request Feedback" on a message
- [ ] Verify feedback is generated

### **7. Romanization Test**
- [ ] Switch to a script language (Japanese, Chinese, etc.)
- [ ] Send a message in that language
- [ ] Check if romanization appears
- [ ] Toggle romanization display options

## **🔍 Debugging Tips**

### **Check Browser Console**
```javascript
// Open browser dev tools (F12) and check for:
// 1. JavaScript errors
// 2. Network request failures
// 3. API response errors
```

### **Check Network Tab**
- Look for failed API calls
- Verify JWT tokens are being sent
- Check response status codes

### **Compare with Original**
- Keep original `AnalyzeClient.tsx` as backup
- Test same functionality on both versions
- Compare console logs and behavior

## **🚨 Common Issues to Watch For**

1. **Import Errors**: Missing dependencies or wrong paths
2. **Type Errors**: TypeScript compilation issues
3. **API Errors**: Backend connectivity problems
4. **State Management**: Hooks not updating state correctly
5. **Event Handlers**: Functions not being called properly

## **✅ Success Criteria**

The refactored version should:
- [ ] Load without errors
- [ ] All buttons and interactions work
- [ ] Audio recording/playback functions
- [ ] Translations and feedback work
- [ ] No console errors
- [ ] Same functionality as original

## **🔄 Rollback Plan**

If issues are found:
1. Keep original `AnalyzeClient.tsx` as backup
2. Switch back by updating the import in `page.tsx`
3. Debug issues in the refactored version
4. Fix and retest

## **📝 Test Results**

Date: ___________
Tester: ___________

### **Passed Tests:**
- [ ] Page Load
- [ ] Audio Recording
- [ ] TTS Playback
- [ ] Translation
- [ ] Conversation Management
- [ ] Feedback System
- [ ] Romanization

### **Failed Tests:**
- [ ] (List any failures)

### **Notes:**
_________________________________
_________________________________
_________________________________
