#!/bin/bash

# 🚀 Render Deployment Script for Heirloom Speech Analysis
# This script helps prepare your application for Render deployment

echo "🚀 Preparing Heirloom Speech Analysis for Render deployment..."

# Check if we're in the right directory
if [ ! -f "python_api.py" ] || [ ! -f "server/index.ts" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    exit 1
fi

echo "✅ Found project files"

# Check for required files
echo "📋 Checking required files..."

required_files=(
    "python_api.py"
    "server/index.ts"
    "requirements.txt"
    "server/package.json"
    "render.yaml"
    "RENDER_DEPLOYMENT_GUIDE.md"
)

for file in "${required_files[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ $file"
    else
        echo "❌ Missing: $file"
        exit 1
    fi
done

echo ""
echo "🔧 Environment Variables Checklist:"
echo ""
echo "Express Backend (Port 4000):"
echo "  - NODE_ENV=production"
echo "  - PORT=4000"
echo "  - SUPABASE_URL"
echo "  - SUPABASE_ANON_KEY"
echo "  - JWT_SECRET"
echo "  - GOOGLE_CLIENT_ID"
echo "  - GOOGLE_CLIENT_SECRET"
echo "  - GOOGLE_API_KEY"
echo "  - GOOGLE_CLOUD_PROJECT"
echo ""
echo "Python API (Port 5000):"
echo "  - PORT=5000"
echo "  - GOOGLE_API_KEY"
echo "  - GOOGLE_CLOUD_PROJECT"
echo "  - SUPABASE_URL"
echo "  - SUPABASE_ANON_KEY"
echo "  - SUPABASE_SERVICE_ROLE_KEY"
echo ""

# Check if .env files exist
if [ -f ".env" ]; then
    echo "✅ Found .env file"
else
    echo "⚠️  No .env file found - you'll need to set environment variables in Render"
fi

if [ -f "server/.env" ]; then
    echo "✅ Found server/.env file"
else
    echo "⚠️  No server/.env file found - you'll need to set environment variables in Render"
fi

echo ""
echo "📚 Next Steps:"
echo "1. Push your code to GitHub"
echo "2. Go to render.com and create two web services:"
echo "   - Express backend (Node.js)"
echo "   - Python API (Python)"
echo "3. Set environment variables in Render dashboard"
echo "4. Deploy both services"
echo "5. Update your Vercel frontend with the new API URLs"
echo ""
echo "📖 See RENDER_DEPLOYMENT_GUIDE.md for detailed instructions"
echo ""
echo "🎉 Ready for deployment!" 