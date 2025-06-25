#!/bin/bash

echo "🚀 Deploying BeyondWords backend to Fly.io..."

# Navigate to server directory
cd server

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Deploy to Fly.io
echo "🛫 Deploying to Fly.io..."
fly deploy

echo "✅ Backend deployment complete!" 