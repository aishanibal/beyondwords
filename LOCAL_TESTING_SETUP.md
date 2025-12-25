# Local Testing Without Authentication

This guide shows how to bypass Supabase authentication for local testing.

## Quick Setup

### 1. Enable Development Mode Bypass

Add this to your `.env.local` file in `client-next/`:

```bash
# Development mode - bypass authentication
NEXT_PUBLIC_BYPASS_AUTH=true
NODE_ENV=development
```

### 2. Server Environment Variable

Add this to your `server/.env` file:

```bash
# Development mode - bypass JWT authentication
BYPASS_AUTH=true
NODE_ENV=development
```

### 3. Restart Services

After setting environment variables, restart:
- Next.js client: `npm run dev`
- Express server: `npm run dev`

## What This Does

- **Client**: Creates a mock user object, bypassing Supabase checks
- **Server**: Skips JWT authentication, allows all requests
- **Pages**: Allows access to protected pages without login

## ⚠️ WARNING

**NEVER enable this in production!** This is for local development only.

