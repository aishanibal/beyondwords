# **Deployment Guide for Speech Analysis Application**

## **Architecture Overview**

Your application consists of three main components:
1. **Frontend**: Next.js application (deploy to Vercel)
2. **Backend API**: Node.js/Express server (deploy to Railway/Render)
3. **AI Processing**: Python Flask API (deploy to Railway/Render)
4. **Database**: Supabase (PostgreSQL)
5. **File Storage**: Supabase Storage
6. **Additional Services**: Cloudflare, etc.

---

## **1. Database Setup (Supabase)**

### **Step 1: Create Supabase Project**
1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Note your project URL and anon key

### **Step 2: Set Up Database Schema**
Run the SQL from `supabase_setup.sql` in your Supabase SQL editor:

```sql
-- Users table
CREATE TABLE users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  google_id TEXT UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  selected_language TEXT DEFAULT 'en',
  target_language TEXT DEFAULT 'en',
  proficiency_level TEXT DEFAULT 'beginner',
  learning_goals TEXT[],
  talk_topics TEXT[]
);

-- Sessions table
CREATE TABLE sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title TEXT,
  synopsis TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Messages table
CREATE TABLE messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  sender TEXT NOT NULL,
  text TEXT NOT NULL,
  romanized_text TEXT,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  message_type TEXT DEFAULT 'text',
  audio_file_path TEXT,
  tts_url TEXT,
  translation TEXT,
  breakdown TEXT,
  detailed_feedback TEXT,
  short_feedback TEXT
);

-- Conversations table
CREATE TABLE conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title TEXT,
  synopsis TEXT,
  persona TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Language dashboards table
CREATE TABLE language_dashboards (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  language_code TEXT NOT NULL,
  total_sessions INTEGER DEFAULT 0,
  total_messages INTEGER DEFAULT 0,
  average_session_length INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, language_code)
);

-- Personas table
CREATE TABLE personas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Waitlist emails table
CREATE TABLE waitlist_emails (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  source TEXT DEFAULT 'website',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE language_dashboards ENABLE ROW LEVEL SECURITY;
ALTER TABLE personas ENABLE ROW LEVEL SECURITY;
ALTER TABLE waitlist_emails ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view own data" ON users FOR ALL USING (auth.uid() = id);
CREATE POLICY "Users can view own sessions" ON sessions FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can view own messages" ON messages FOR ALL USING (session_id IN (SELECT id FROM sessions WHERE user_id = auth.uid()));
CREATE POLICY "Users can view own conversations" ON conversations FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can view own language dashboards" ON language_dashboards FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can view own personas" ON personas FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Anyone can insert waitlist emails" ON waitlist_emails FOR INSERT WITH CHECK (true);
```

### **Step 3: Set Up Storage Buckets**
1. Go to Storage in your Supabase dashboard
2. Create a bucket called `audio-uploads`
3. Create a bucket called `tts-output`
4. Set appropriate RLS policies

---

## **2. Frontend Deployment (Vercel)**

### **Step 1: Prepare Environment Variables**
Create a `.env.local` file in `client-next/`:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_API_URL=https://your-backend-api.railway.app
NEXT_PUBLIC_PYTHON_API_URL=https://your-python-api.railway.app
```

### **Step 2: Deploy to Vercel**
1. Install Vercel CLI: `npm i -g vercel`
2. Navigate to `client-next/` directory
3. Run: `vercel --prod`
4. Set environment variables in Vercel dashboard

### **Step 3: Configure Custom Domain (Optional)**
1. Go to Vercel dashboard
2. Add custom domain
3. Configure DNS settings

---

## **3. Backend API Deployment (Railway)**

### **Step 1: Prepare Environment Variables**
Create a `.env` file in `server/`:

```bash
JWT_SECRET=your_jwt_secret_here
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
FRONTEND_URL=https://your-frontend.vercel.app
PYTHON_API_URL=https://your-python-api.railway.app
```

### **Step 2: Deploy to Railway**
1. Go to [railway.app](https://railway.app)
2. Create new project
3. Connect your GitHub repository
4. Set the source directory to `server/`
5. Add environment variables
6. Deploy

### **Step 3: Update CORS Settings**
Update the CORS configuration in `server/index.ts`:

```typescript
app.use(cors({ 
  origin: process.env.FRONTEND_URL || 'http://localhost:3000', 
  credentials: true 
}));
```

---

## **4. Python API Deployment (Railway)**

### **Step 1: Prepare Environment Variables**
Create a `.env` file in the root directory:

```bash
GOOGLE_API_KEY=your_google_api_key
GOOGLE_CLOUD_PROJECT=your_google_cloud_project
FRONTEND_URL=https://your-frontend.vercel.app
BACKEND_API_URL=https://your-backend-api.railway.app
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

### **Step 2: Deploy to Railway**
1. Create another Railway project
2. Set source directory to root (where `python_api.py` is)
3. Add environment variables
4. Deploy

### **Step 3: Update Python API CORS**
Update CORS in `python_api.py`:

```python
CORS(app, origins=[
    os.getenv('FRONTEND_URL', 'http://localhost:3000'),
    os.getenv('BACKEND_API_URL', 'http://localhost:4000')
])
```

---

## **5. Additional Services**

### **Cloudflare (Optional but Recommended)**
1. **DNS Management**: Use Cloudflare for DNS
2. **CDN**: Enable Cloudflare CDN for better performance
3. **Security**: Enable WAF and DDoS protection

### **Monitoring & Analytics**
1. **Sentry**: For error tracking
2. **Google Analytics**: For user analytics
3. **Railway/Render Logs**: For API monitoring

### **File Storage Optimization**
1. **Supabase Storage**: For audio files and TTS output
2. **CDN**: For faster file delivery
3. **Backup**: Regular database backups

---

## **6. Environment Variables Summary**

### **Frontend (Vercel)**
```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_API_URL=
NEXT_PUBLIC_PYTHON_API_URL=
```

### **Backend API (Railway)**
```bash
JWT_SECRET=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
FRONTEND_URL=
PYTHON_API_URL=
PORT=4000
```

### **Python API (Railway)**
```bash
GOOGLE_API_KEY=
GOOGLE_CLOUD_PROJECT=
FRONTEND_URL=
BACKEND_API_URL=
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
PORT=5000
```

---

## **7. Deployment Commands**

### **Frontend**
```bash
cd client-next
vercel --prod
```

### **Backend API**
```bash
cd server
railway login
railway init
railway up
```

### **Python API**
```bash
railway login
railway init
railway up
```

---

## **8. Post-Deployment Checklist**

- [ ] Test all API endpoints
- [ ] Verify file uploads work
- [ ] Test TTS functionality
- [ ] Check CORS settings
- [ ] Verify authentication flow
- [ ] Test audio recording/playback
- [ ] Monitor error logs
- [ ] Set up monitoring alerts
- [ ] Configure backups
- [ ] Test on different devices/browsers

---

## **9. Cost Optimization**

### **Vercel**
- Free tier: 100GB bandwidth, 100 serverless function executions
- Pro: $20/month for more usage

### **Railway**
- Free tier: $5 credit/month
- Pro: Pay-as-you-go

### **Supabase**
- Free tier: 500MB database, 1GB file storage
- Pro: $25/month for more usage

### **Google Cloud**
- Free tier: $300 credit for 90 days
- Pay-as-you-go after

---

## **10. Security Considerations**

1. **Environment Variables**: Never commit secrets to Git
2. **CORS**: Configure properly for production
3. **Rate Limiting**: Implement on APIs
4. **Input Validation**: Validate all user inputs
5. **File Upload Security**: Validate file types and sizes
6. **HTTPS**: Ensure all endpoints use HTTPS
7. **Database Security**: Use RLS policies in Supabase

---

## **11. Performance Optimization**

1. **CDN**: Use Cloudflare for static assets
2. **Caching**: Implement Redis for session storage
3. **Database Indexing**: Add indexes for frequently queried columns
4. **Image Optimization**: Use Next.js Image component
5. **Code Splitting**: Implement lazy loading
6. **API Optimization**: Use connection pooling

---

## **12. Troubleshooting**

### **Common Issues**
1. **CORS Errors**: Check origin settings
2. **File Upload Failures**: Verify storage permissions
3. **TTS Issues**: Check Google Cloud credentials
4. **Database Connection**: Verify Supabase connection
5. **Memory Issues**: Monitor resource usage

### **Debug Commands**
```bash
# Check Railway logs
railway logs

# Check Vercel deployment
vercel ls

# Test API endpoints
curl https://your-api.railway.app/health
```

---

## **13. Maintenance**

### **Regular Tasks**
1. **Security Updates**: Keep dependencies updated
2. **Database Backups**: Automated daily backups
3. **Log Monitoring**: Check for errors regularly
4. **Performance Monitoring**: Monitor response times
5. **Cost Monitoring**: Track usage and costs

### **Scaling Considerations**
1. **Database**: Consider read replicas for high traffic
2. **API**: Implement load balancing
3. **Storage**: Use CDN for file delivery
4. **Caching**: Implement Redis for session management

---

This deployment guide covers all the essential steps to get your speech analysis application running in production. Make sure to test thoroughly in each environment before going live! 