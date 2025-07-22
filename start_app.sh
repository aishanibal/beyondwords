#!/bin/bash

# BeyondWords Speech Analysis Startup Script
# This script starts all the necessary services for the application

echo "🎯 BeyondWords Speech Analysis"
echo "=============================="

# Check if GOOGLE_API_KEY is set
if [ -z "$GOOGLE_API_KEY" ]; then
    echo "❌ Error: GOOGLE_API_KEY environment variable is not set!"
    echo "Please set your Google AI API key:"
    echo "export GOOGLE_API_KEY='your-api-key-here'"
    echo ""
    echo "You can get a free API key from: https://makersuite.google.com/app/apikey"
    exit 1
fi

echo "✅ Google API key is configured"

# Check if Python dependencies are installed
echo "🔍 Checking Python dependencies..."
if ! python -c "import flask, google.generativeai, whisper, torch" 2>/dev/null; then
    echo "❌ Python dependencies not found. Installing..."
    pip install -r requirements.txt
    if [ $? -ne 0 ]; then
        echo "❌ Failed to install Python dependencies"
        exit 1
    fi
fi
echo "✅ Python dependencies are installed"

# Test Gemini integration
echo "🧪 Testing Gemini integration..."
python test_gemini.py
if [ $? -ne 0 ]; then
    echo "❌ Gemini integration test failed"
    echo "Please check your API key and internet connection"
    exit 1
fi
echo "✅ Gemini integration test passed"

# Check if Node.js dependencies are installed
echo "🔍 Checking Node.js dependencies..."
if [ ! -d "server/node_modules" ]; then
    echo "📦 Installing server dependencies..."
    cd server
    npm install
    if [ $? -ne 0 ]; then
        echo "❌ Failed to install server dependencies"
        exit 1
    fi
    cd ..
fi

if [ ! -d "client/node_modules" ]; then
    echo "📦 Installing client dependencies..."
    cd client
    npm install
    if [ $? -ne 0 ]; then
        echo "❌ Failed to install client dependencies"
        exit 1
    fi
    cd ..
fi
echo "✅ Node.js dependencies are installed"

# Create necessary directories
mkdir -p server/uploads
mkdir -p tts_output

echo ""
echo "🚀 Starting BeyondWords Speech Analysis..."
echo ""
echo "Services will be available at:"
echo "  • Frontend: http://localhost:3000"
echo "  • Backend API: http://localhost:3001"
echo "  • Python API: http://localhost:5000"
echo ""
echo "Press Ctrl+C to stop all services"
echo ""

# Function to cleanup background processes
cleanup() {
    echo ""
    echo "🛑 Stopping all services..."
    kill $PYTHON_PID $SERVER_PID $CLIENT_PID 2>/dev/null
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

# Start Python API in background
echo "🐍 Starting Python API..."
python python_api.py &
PYTHON_PID=$!

# Wait a moment for Python API to start
sleep 3

# Start Express server in background
echo "🖥️  Starting Express server..."
cd server
npm start &
SERVER_PID=$!
cd ..

# Wait a moment for server to start
sleep 3

# Start React client in background
echo "⚛️  Starting React client..."
cd client
npm start &
CLIENT_PID=$!
cd ..

echo ""
echo "✅ All services started successfully!"
echo ""
echo "📱 Open your browser and go to: http://localhost:3000"
echo ""
echo "🔧 To view logs:"
echo "  • Python API: Check terminal output"
echo "  • Express server: Check terminal output"
echo "  • React client: Check terminal output"
echo ""

# Wait for user to stop
wait 