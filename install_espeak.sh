#!/bin/bash
set -e

echo "Installing espeak..."
apt-get update
apt-get install -y espeak espeak-data

echo "Verifying espeak installation..."
which espeak
espeak --version

echo "Testing espeak..."
echo "Testing espeak" | espeak -s 150 -v en

echo "Installing Python dependencies..."
pip install -r requirements.txt

echo "Installation complete!"
