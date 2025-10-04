# 🚀 Render Deployment Guide

This guide will help you deploy your Heirloom Speech Analysis application to Render, connecting your Express backend (port 4000), Python API backend (port 5000), Vercel frontend, and Supabase database.

## **📋 Prerequisites**

1. **Render Account**: Sign up at [render.com](https://render.com)
2. **Vercel Account**: For frontend deployment
3. **Supabase Project**: For database
4. **Google Cloud Project**: For API keys

## **🏗️ Architecture Overview**

```
Vercel Frontend → Express Backend (4000) → Supabase
                → Python API (5000) → Supabase
```

## **🔧 Step 1: Prepare Environment Variables**

### **Express Backend (Port 4000)**
```bash
NODE_ENV=production
PORT=4000
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
JWT_SECRET=your_jwt_secret
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_API_KEY=your_google_api_key
GOOGLE_CLOUD_PROJECT=your_google_cloud_project
```

### **Python API (Port 5000)**
```bash
PORT=5000
GOOGLE_API_KEY=your_google_api_key
GOOGLE_CLOUD_PROJECT=your_google_cloud_project
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

## **🚀 Step 2: Deploy Express Backend**

1. **Connect Repository to Render**
   - Go to [render.com](https://render.com)
   - Click "New +" → "Web Service"
   - Connect your GitHub repository

2. **Configure Express Backend**
   ```
   Name: beyondwords-express
   Environment: Node
   Build Command: cd server && npm install && npm run build
   Start Command: cd server && npm start
   ```

3. **Set Environment Variables**
   - Add all Express backend environment variables listed above
   - Set `NODE_ENV=production`
   - Set `PORT=4000`

4. **Deploy**
   - Click "Create Web Service"
   - Wait for build to complete
   - Note the URL (e.g., `https://beyondwords-express.onrender.com`)

## **🐍 Step 3: Deploy Python API**

1. **Create New Web Service**
   - Click "New +" → "Web Service"
   - Connect the same repository

2. **Configure Python API**
   ```
   Name: beyondwords
   Environment: Python
   Build Command: pip install -r requirements.txt
   Start Command: python python_api.py
   ```

3. **Set Environment Variables**
   - Add all Python API environment variables listed above
   - Set `PORT=5000`

4. **Deploy**
   - Click "Create Web Service"
   - Wait for build to complete
   - Note the URL (e.g., `https://heirloom-python-api.onrender.com`)

## **🔗 Step 4: Update Frontend Configuration**

Update your Vercel frontend to use the Render backend URLs:

### **Environment Variables for Vercel**
```bash
NEXT_PUBLIC_BACKEND_URL=https://beyondwords-express.onrender.com
AI_BACKEND_URL=https://beyondwords.onrender.com
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### **Update API Calls**
In your frontend code, replace localhost URLs with the Render URLs:

```javascript
// Before
const expressApiUrl = 'http://localhost:4000';
const pythonApiUrl = 'http://localhost:5000';

// After
const expressApiUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
const pythonApiUrl = process.env.AI_BACKEND_URL;
```

## **🔧 Step 5: Configure CORS**

The Express backend is already configured to handle CORS for production. The Python API uses Flask-CORS which should work automatically.

## **📊 Step 6: Test Your Deployment**

1. **Health Checks**
   ```bash
   # Test Express Backend
   curl https://beyondwords-express.onrender.com/api/health
   
   # Test Python API
   curl https://beyondwords.onrender.com/health
   ```

2. **Admin Dashboard**
   - Visit: `https://beyondwords.onrender.com/admin`
   - Login with: `admin123`

## **🔒 Step 7: Security Considerations**

1. **Environment Variables**: Never commit API keys to your repository
2. **CORS**: Ensure only your Vercel domain is allowed
3. **Rate Limiting**: Consider adding rate limiting for production
4. **SSL**: Render provides SSL certificates automatically

## **📈 Step 8: Monitoring**

1. **Render Dashboard**: Monitor logs and performance
2. **Health Checks**: Set up automated health checks
3. **Error Tracking**: Consider adding error tracking (Sentry, etc.)

## **🔄 Step 9: Continuous Deployment**

Render automatically deploys when you push to your main branch. To disable:

1. Go to your service in Render
2. Settings → Build & Deploy
3. Toggle "Auto-Deploy"

## **🚨 Troubleshooting**

### **Common Issues**

1. **Build Failures**
   ```bash
   # Check build logs in Render dashboard
   # Ensure all dependencies are in requirements.txt/package.json
   ```

2. **Environment Variables**
   ```bash
   # Verify all required env vars are set
   # Check for typos in variable names
   ```

3. **CORS Errors**
   ```bash
   # Update CORS configuration in Express server
   # Ensure Vercel domain is in allowed origins
   ```

4. **Database Connection**
   ```bash
   # Verify Supabase connection strings
   # Check if database is accessible from Render
   ```

### **Debug Commands**

```bash
# Check service status
curl -I https://your-service.onrender.com/health

# View logs in Render dashboard
# Go to your service → Logs

# Test specific endpoints
curl -X POST https://your-service.onrender.com/api/endpoint \
  -H "Content-Type: application/json" \
  -d '{"key": "value"}'
```

## **💰 Cost Optimization**

1. **Free Tier**: Render offers free tier for development
2. **Auto-Sleep**: Services sleep after 15 minutes of inactivity
3. **Scaling**: Upgrade only when needed

## **📝 Next Steps**

1. **Domain**: Add custom domain if needed
2. **CDN**: Consider adding CDN for static assets
3. **Backup**: Set up database backups
4. **Monitoring**: Add application monitoring

## **🎉 Success!**

Your application is now deployed on Render with:
- ✅ Express backend on port 4000
- ✅ Python API on port 5000
- ✅ Connected to Vercel frontend
- ✅ Connected to Supabase database
- ✅ Admin dashboard accessible
- ✅ Google API toggle working

**Admin Dashboard**: `https://heirloom-python-api.onrender.com/admin`
**Default Password**: `admin123` 