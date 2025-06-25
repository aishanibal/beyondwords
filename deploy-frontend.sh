#!/bin/bash

echo "🚀 Deploying BeyondWords frontend to Vercel..."

# Navigate to client directory
cd client

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Build the project
echo "🔨 Building project..."
npm run build

# Deploy to Vercel
echo "🌐 Deploying to Vercel..."
vercel --prod

echo "✅ Frontend deployment complete!" 