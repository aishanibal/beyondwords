#!/bin/bash

echo "🚀 Deploying Python API to Render..."

# Check if render CLI is installed
if ! command -v render &> /dev/null; then
    echo "❌ Render CLI not found. Please install it first:"
    echo "   brew install render"
    exit 1
fi

# Deploy to Render
echo "📦 Building and deploying Python API..."
render deploy

echo "✅ Python API deployment initiated!"
echo "🔗 Check your Render dashboard for the deployment status"
echo "🔗 Admin Dashboard will be available at: https://your-service-name.onrender.com/admin"
echo "🔑 Default admin password: admin123" 