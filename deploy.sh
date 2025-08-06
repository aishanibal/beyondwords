#!/bin/bash

# **Deployment Script for Speech Analysis Application**
# This script helps automate the deployment process

set -e

echo "🚀 Starting deployment process..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if required tools are installed
check_dependencies() {
    print_status "Checking dependencies..."
    
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed. Please install Node.js first."
        exit 1
    fi
    
    if ! command -v npm &> /dev/null; then
        print_error "npm is not installed. Please install npm first."
        exit 1
    fi
    
    if ! command -v vercel &> /dev/null; then
        print_warning "Vercel CLI is not installed. Installing..."
        npm install -g vercel
    fi
    
    if ! command -v railway &> /dev/null; then
        print_warning "Railway CLI is not installed. Please install from https://railway.app"
        print_status "You can install Railway CLI manually and run this script again."
    fi
    
    print_success "Dependencies checked!"
}

# Deploy frontend to Vercel
deploy_frontend() {
    print_status "Deploying frontend to Vercel..."
    
    cd client-next
    
    # Check if .env.local exists
    if [ ! -f .env.local ]; then
        print_warning ".env.local not found. Please create it with your environment variables."
        print_status "Copy env.example to .env.local and update the values."
        return 1
    fi
    
    # Install dependencies
    print_status "Installing frontend dependencies..."
    npm install
    
    # Build the project
    print_status "Building frontend..."
    npm run build
    
    # Deploy to Vercel
    print_status "Deploying to Vercel..."
    vercel --prod --yes
    
    print_success "Frontend deployed successfully!"
    cd ..
}

# Deploy backend to Railway
deploy_backend() {
    print_status "Deploying backend to Railway..."
    
    cd server
    
    # Check if .env exists
    if [ ! -f .env ]; then
        print_warning ".env not found. Please create it with your environment variables."
        print_status "Copy env.example to .env and update the values."
        return 1
    fi
    
    # Install dependencies
    print_status "Installing backend dependencies..."
    npm install
    
    # Build the project
    print_status "Building backend..."
    npm run build
    
    # Deploy to Railway
    if command -v railway &> /dev/null; then
        print_status "Deploying to Railway..."
        railway up
    else
        print_warning "Railway CLI not found. Please deploy manually:"
        print_status "1. Go to railway.app"
        print_status "2. Create new project"
        print_status "3. Connect this repository"
        print_status "4. Set source directory to 'server'"
        print_status "5. Add environment variables"
        print_status "6. Deploy"
    fi
    
    print_success "Backend deployment instructions provided!"
    cd ..
}

# Deploy Python API to Railway
deploy_python_api() {
    print_status "Deploying Python API to Railway..."
    
    # Check if .env exists
    if [ ! -f .env ]; then
        print_warning ".env not found. Please create it with your environment variables."
        print_status "Copy env.example to .env and update the values."
        return 1
    fi
    
    # Check if requirements file exists
    if [ ! -f python_api_requirements.txt ]; then
        print_error "python_api_requirements.txt not found!"
        return 1
    fi
    
    # Deploy to Railway
    if command -v railway &> /dev/null; then
        print_status "Deploying Python API to Railway..."
        railway up
    else
        print_warning "Railway CLI not found. Please deploy manually:"
        print_status "1. Go to railway.app"
        print_status "2. Create new project"
        print_status "3. Connect this repository"
        print_status "4. Set source directory to root (where python_api.py is)"
        print_status "5. Add environment variables"
        print_status "6. Deploy"
    fi
    
    print_success "Python API deployment instructions provided!"
}

# Setup Supabase
setup_supabase() {
    print_status "Setting up Supabase..."
    
    print_status "Please follow these steps manually:"
    print_status "1. Go to supabase.com and create a new project"
    print_status "2. Run the SQL from supabase_setup.sql in the SQL editor"
    print_status "3. Create storage buckets: 'audio-uploads' and 'tts-output'"
    print_status "4. Note your project URL and anon key"
    print_status "5. Update your environment variables"
}

# Main deployment function
main() {
    echo "🎯 Speech Analysis Application Deployment"
    echo "========================================"
    
    # Check dependencies
    check_dependencies
    
    # Ask user what to deploy
    echo ""
    echo "What would you like to deploy?"
    echo "1. Frontend (Vercel)"
    echo "2. Backend API (Railway)"
    echo "3. Python API (Railway)"
    echo "4. Setup Supabase"
    echo "5. Deploy All"
    echo "6. Exit"
    
    read -p "Enter your choice (1-6): " choice
    
    case $choice in
        1)
            deploy_frontend
            ;;
        2)
            deploy_backend
            ;;
        3)
            deploy_python_api
            ;;
        4)
            setup_supabase
            ;;
        5)
            deploy_frontend
            deploy_backend
            deploy_python_api
            setup_supabase
            ;;
        6)
            print_status "Exiting..."
            exit 0
            ;;
        *)
            print_error "Invalid choice. Please try again."
            exit 1
            ;;
    esac
    
    echo ""
    print_success "Deployment process completed!"
    print_status "Don't forget to:"
    print_status "1. Test all endpoints"
    print_status "2. Verify environment variables"
    print_status "3. Check CORS settings"
    print_status "4. Monitor logs for errors"
}

# Run main function
main "$@" 