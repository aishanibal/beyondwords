#!/bin/bash
# Run Python API locally for development
# Usage: ./scripts/run-local.sh

set -e

# Ensure we're in the project root
cd "$(dirname "$0")/.."

# Check if .env file exists
if [ ! -f .env ]; then
    echo "⚠️  No .env file found. Creating from template..."
    cat > .env << 'EOF'
# Google AI API Key (for local development)
GOOGLE_API_KEY=your-api-key-here

# Optional: Use Vertex AI instead of API key
# USE_VERTEX_AI=true
# GCP_PROJECT_ID=your-project-id
# GCP_LOCATION=us-central1

# Server port (default: 5000)
PORT=5000
EOF
    echo "📝 Created .env file. Please edit it with your API key."
    echo "   Then run this script again."
    exit 1
fi

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "📦 Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
echo "🔧 Activating virtual environment..."
source venv/bin/activate

# Install dependencies
echo "📥 Installing dependencies..."
pip install -r requirements.txt

# Run the server
echo ""
echo "🚀 Starting Python API server..."
echo "   URL: http://localhost:5000"
echo "   Admin: http://localhost:5000/admin"
echo ""
python python_api.py

