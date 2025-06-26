# Supabase Integration Setup

This guide will help you set up Supabase to save waitlist emails from your React app.

## Step 1: Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new account or sign in
2. Create a new project
3. Wait for the project to be set up (this may take a few minutes)

## Step 2: Get Your Supabase Credentials

1. In your Supabase dashboard, go to **Settings** → **API**
2. Copy your **Project URL** and **anon/public key**
3. These will be used in your environment variables

## Step 3: Set Up the Database Table

1. In your Supabase dashboard, go to **SQL Editor**
2. Copy and paste the contents of `supabase_setup.sql` into the editor
3. Run the SQL script to create the `waitlist_emails` table and set up security policies

## Step 4: Configure Environment Variables

1. In your `client` directory, create a `.env` file:
   ```bash
   cp env.example .env
   ```

2. Edit the `.env` file and add your Supabase credentials:
   ```
   REACT_APP_SUPABASE_URL=your_supabase_project_url_here
   REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key_here
   ```

## Step 5: Install Supabase Client

Run this command in your `client` directory:
```bash
npm install @supabase/supabase-js
```

## Step 6: Test the Integration

1. Start your React app: `npm start`
2. Try submitting an email through the waitlist form
3. Check your Supabase dashboard → **Table Editor** → **waitlist_emails** to see if the email was saved

## Database Schema

The `waitlist_emails` table has the following structure:

- `id`: Primary key (auto-incrementing)
- `email`: Email address (unique)
- `source`: Where the email came from (e.g., 'hero_form', 'footer_form')
- `created_at`: Timestamp when the email was added
- `updated_at`: Timestamp when the record was last updated

## Security Features

- **Row Level Security (RLS)** is enabled
- Anyone can insert emails (for waitlist signups)
- Only authenticated users can read emails (for admin purposes)
- Email addresses are unique to prevent duplicates

## Analytics

A view called `waitlist_analytics` is created that shows:
- Daily signup counts
- Signups by source
- Useful for tracking growth and conversion

## Troubleshooting

### Common Issues:

1. **"Invalid API key" error**: Check that your environment variables are correct and the app has been restarted
2. **"Table doesn't exist" error**: Make sure you've run the SQL setup script
3. **CORS errors**: Supabase handles CORS automatically, but make sure your project URL is correct

### Testing the Connection:

You can test the Supabase connection by adding this to your browser console:
```javascript
import { supabase } from './src/supabase.js'
const { data, error } = await supabase.from('waitlist_emails').select('count')
console.log('Connection test:', { data, error })
```

## Next Steps

Once this is working, you might want to:

1. Create an admin dashboard to view all waitlist emails
2. Add email validation and rate limiting
3. Set up email notifications when new people join
4. Add analytics tracking for conversion rates 