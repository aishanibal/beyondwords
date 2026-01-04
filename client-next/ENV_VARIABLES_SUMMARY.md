# Environment Variables Summary

## ✅ **ACTUALLY USED IN CODEBASE**

### **1. Environment Detection**
- `NEXT_PUBLIC_ENVIRONMENT` - Set to `production`/`prod` for prod, anything else = local
  - Defaults to `NODE_ENV` if not set

### **2. Firebase Configuration (shared for both local and production)**
**Client Config (NEXT_PUBLIC_ = exposed to browser):**
- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`

**Admin Config (server-side only):**
- `FIREBASE_PROJECT_ID` (optional, falls back to NEXT_PUBLIC)
- `FIREBASE_CLIENT_EMAIL`
- `FIREBASE_PRIVATE_KEY`

### **4. Firebase Emulator (optional, for local testing)**
- `NEXT_PUBLIC_USE_FIREBASE_EMULATOR` - Set to `true` to use emulators

### **5. Google OAuth**
- `NEXT_PUBLIC_GOOGLE_CLIENT_ID` - **REQUIRED** (used in ClientLayout.tsx)

### **6. Python API Backend**
- `AI_BACKEND_URL` - Optional (defaults to Cloud Run URL)
  - For local: `http://localhost:5000`
  - For prod: `https://beyondwordsapi-759507959904.us-east1.run.app`
- `AI_API_TIMEOUT` - Optional (defaults to 60000ms)

### **7. Development Helpers (optional)**
- `NEXT_PUBLIC_BYPASS_AUTH` - Set to `true` to bypass auth in dev mode

---

## ❌ **NOT USED / DEPRECATED**

- `NEXT_PUBLIC_BACKEND_URL` - Only used in archived code (`app/analyze/archive/`)
- `BACKEND_URL` - Only in next.config.ts, not actually used
- `SENDGRID_API_KEY` - Commented out in contact route
- `FIREBASE_SERVICE_ACCOUNT_KEY` - Not used (uses individual keys instead)

---

## 📋 **CONDENSED TEMPLATE**

For `.env.local`, you need:

```bash
# Environment
NEXT_PUBLIC_ENVIRONMENT=local

# Firebase (shared for both local and production)
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
FIREBASE_CLIENT_EMAIL=...
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# Google OAuth
NEXT_PUBLIC_GOOGLE_CLIENT_ID=...

# Python API (optional)
AI_BACKEND_URL=https://beyondwordsapi-759507959904.us-east1.run.app

# Optional dev helpers
NEXT_PUBLIC_USE_FIREBASE_EMULATOR=false
NEXT_PUBLIC_BYPASS_AUTH=false
```

**Total: ~12 variables** (8 Firebase + 1 Google OAuth + 1 environment + 2 optional overrides)

