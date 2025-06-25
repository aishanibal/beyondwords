#!/bin/bash

echo "🚀 Starting BeyondWords Speech Analysis Services..."
echo "================================================"

# Function to check if a port is in use
check_port() {
    lsof -i :$1 > /dev/null 2>&1
}

# Function to wait for a service to be ready
wait_for_service() {
    local port=$1
    local service_name=$2
    echo "⏳ Waiting for $service_name to be ready on port $port..."
    while ! check_port $port; do
        sleep 1
    done
    echo "✅ $service_name is ready!"
}

# Start Python API (port 5000)
echo "🐍 Starting Python Speech Analysis API..."
cd "$(dirname "$0")"
python python_api.py &
PYTHON_PID=$!

# Wait for Python API to be ready
wait_for_service 5000 "Python API"

# Start Express server (port 4000)
echo "🟢 Starting Express Server..."
cd server
npm start &
EXPRESS_PID=$!

# Wait for Express server to be ready
wait_for_service 4000 "Express Server"

# Start React client (port 3000)
echo "⚛️  Starting React Client..."
cd ../client
npm start &
REACT_PID=$!

# Wait for React client to be ready
wait_for_service 3000 "React Client"

echo ""
echo "🎉 All services are running!"
echo "============================"
echo "📱 React Client: http://localhost:3000"
echo "🟢 Express Server: http://localhost:4000"
echo "🐍 Python API: http://localhost:5000"
echo ""
echo "Press Ctrl+C to stop all services"

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "🛑 Stopping all services..."
    kill $PYTHON_PID 2>/dev/null
    kill $EXPRESS_PID 2>/dev/null
    kill $REACT_PID 2>/dev/null
    echo "✅ All services stopped"
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

# Keep script running
wait 