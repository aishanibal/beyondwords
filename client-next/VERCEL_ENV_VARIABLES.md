# Vercel Environment Variables

## ✅ **REQUIRED Variables for Production**

Add these in your Vercel project settings (Settings → Environment Variables):

### **1. Environment**
```
NEXT_PUBLIC_ENVIRONMENT=production
```
**Important:** Set this to `production` so the app uses production config (production URLs, no emulators, etc.)

### **2. Firebase Client Config (NEXT_PUBLIC_ = exposed to browser)**
```
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_firebase_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

### **3. Firebase Admin Config (server-side only)**
```
FIREBASE_PROJECT_ID=your_firebase_project_id
FIREBASE_CLIENT_EMAIL=your_service_account_email@your_project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```
**Note:** For `FIREBASE_PRIVATE_KEY`, paste the entire private key including `-----BEGIN PRIVATE KEY-----` and `-----END PRIVATE KEY-----`. Keep the `\n` characters as-is (Vercel will handle newlines correctly).

### **4. Google OAuth**
```
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_oauth_client_id
```

---

## 🔧 **OPTIONAL Variables**

These have defaults, so you only need them if you want to override:

### **Python API URL (optional)**
```
AI_BACKEND_URL=https://beyondwordsapi-759507959904.us-east1.run.app
```
**Default:** Already hardcoded in production config, so only set this if you want to override.

### **API Timeout (optional)**
```
AI_API_TIMEOUT=60000
```
**Default:** 60000ms (60 seconds)

---

## ❌ **DO NOT SET in Production**

These should **NOT** be set in Vercel (they're for local development only):

- ❌ `NEXT_PUBLIC_USE_FIREBASE_EMULATOR` - Will be `false` in production anyway
- ❌ `NEXT_PUBLIC_BYPASS_AUTH` - Security risk in production!

---

## 📋 **Quick Checklist**

✅ Set `NEXT_PUBLIC_ENVIRONMENT=production`  
✅ All 6 `NEXT_PUBLIC_FIREBASE_*` variables  
✅ 3 Firebase Admin variables (`FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`)  
✅ `NEXT_PUBLIC_GOOGLE_CLIENT_ID`  

**Total: 11 required variables**

---

## 🔍 **How to Set in Vercel**

1. Go to your Vercel project dashboard
2. Settings → Environment Variables
3. Add each variable above
4. Select **Production** environment (and optionally Preview/Development if you want)
5. Save and redeploy

**Tip:** You can select "Production, Preview, and Development" if you want to use the same values for all environments.

