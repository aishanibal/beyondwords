# BeyondWords Deployment Guide

## Tech Stack
- **Frontend**: React (Vercel)
- **Backend**: Node.js/Express (Fly.io)
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Google OAuth

## Prerequisites

### 1. Install CLI Tools
```bash
# Vercel CLI
npm i -g vercel

# Fly.io CLI
curl -L https://fly.io/install.sh | sh

# Supabase CLI
npm install -g supabase
```

### 2. Set up Accounts
- [Vercel](https://vercel.com) - Frontend hosting
- [Fly.io](https://fly.io) - Backend hosting
- [Supabase](https://supabase.com) - Database

## Frontend Deployment (Vercel)

### 1. Initial Setup
```bash
cd client
vercel login
vercel
```

### 2. Environment Variables
Set in Vercel dashboard:
- `REACT_APP_API_URL`: Your Fly.io backend URL (e.g., `https://beyondwords-api.fly.dev`)

### 3. Deploy
```bash
# Using script
chmod +x deploy-frontend.sh
./deploy-frontend.sh

# Or manually
cd client
vercel --prod
```

## Backend Deployment (Fly.io)

### 1. Initial Setup
```bash
cd server
fly auth login
fly launch
```

### 2. Environment Variables
Set in Fly.io dashboard:
```bash
fly secrets set NODE_ENV=production
fly secrets set DATABASE_URL=your_supabase_connection_string
fly secrets set GOOGLE_CLIENT_ID=your_google_oauth_client_id
fly secrets set GOOGLE_CLIENT_SECRET=your_google_oauth_client_secret
fly secrets set SESSION_SECRET=your_session_secret
```

### 3. Deploy
```bash
# Using script
chmod +x deploy-backend.sh
./deploy-backend.sh

# Or manually
cd server
fly deploy
```

## Database Setup (Supabase)

### 1. Create Project
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Create new project
3. Note down connection string and API keys

### 2. Database Schema
```sql
-- Users table
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  google_id VARCHAR(255) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255),
  role VARCHAR(50) DEFAULT 'user',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Chat sessions table
CREATE TABLE chat_sessions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  session_data JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Waitlist table
CREATE TABLE waitlist (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### 3. Row Level Security (RLS)
```sql
-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE waitlist ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view own data" ON users
  FOR SELECT USING (auth.uid()::text = google_id);

CREATE POLICY "Users can view own sessions" ON chat_sessions
  FOR SELECT USING (user_id = (SELECT id FROM users WHERE google_id = auth.uid()::text));
```

## Environment Configuration

### Frontend (.env.local)
```env
REACT_APP_API_URL=https://beyondwords-api.fly.dev
REACT_APP_GOOGLE_CLIENT_ID=your_google_client_id
```

### Backend (.env)
```env
NODE_ENV=production
PORT=3001
DATABASE_URL=your_supabase_connection_string
GOOGLE_CLIENT_ID=your_google_oauth_client_id
GOOGLE_CLIENT_SECRET=your_google_oauth_client_secret
SESSION_SECRET=your_session_secret
CORS_ORIGIN=https://your-vercel-domain.vercel.app
```

## Enabling MVP Features

When ready to deploy the MVP:

1. **Uncomment Analyze route** in `client/src/App.js`:
   ```javascript
   // Remove comments from:
   // <Link to="/analyze">Analyze</Link>
   // <Route path="/analyze" element={<Analyze />} />
   ```

2. **Update environment variables** with production API endpoints

3. **Deploy both frontend and backend**

## Monitoring & Maintenance

### Vercel
- Monitor in Vercel dashboard
- Set up alerts for build failures
- Configure custom domain

### Fly.io
- Monitor with `fly status`
- View logs with `fly logs`
- Scale with `fly scale count 2`

### Supabase
- Monitor in Supabase dashboard
- Set up database backups
- Monitor query performance

## Troubleshooting

### Common Issues
1. **CORS errors**: Check CORS_ORIGIN in backend
2. **Database connection**: Verify DATABASE_URL format
3. **OAuth issues**: Check Google Client ID/Secret
4. **Build failures**: Check Vercel build logs

### Useful Commands
```bash
# Check Fly.io status
fly status

# View Fly.io logs
fly logs

# Check Vercel deployment
vercel ls

# Rollback Fly.io deployment
fly deploy --image-label v1
``` 