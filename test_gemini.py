#!/usr/bin/env python3
"""
Test script for Gemini integration
"""

import os
import sys
from gemini_client import get_conversational_response, get_detailed_feedback, is_ollama_ready

def test_gemini_health():
    """Test if Gemini API is accessible"""
    print("🔍 Testing Gemini API health...")
    
    if not os.getenv("GOOGLE_API_KEY"):
        print("❌ GOOGLE_API_KEY environment variable not set!")
        print("Please set your Google API key:")
        print("export GOOGLE_API_KEY='your-api-key-here'")
        return False
    
    try:
        is_ready = is_ollama_ready()
        if is_ready:
            print("✅ Gemini API is ready!")
            return True
        else:
            print("❌ Gemini API health check failed")
            return False
    except Exception as e:
        print(f"❌ Error testing Gemini API: {e}")
        return False

def test_conversational_response():
    """Test conversational response generation"""
    print("\n🗣️ Testing conversational response...")
    
    try:
        # Test with English
        response = get_conversational_response(
            "Hello, how are you today?",
            [],
            'en'
        )
        print(f"✅ English response: {response}")
        
        # Test with Spanish
        response = get_conversational_response(
            "Hola, ¿cómo estás?",
            [],
            'es'
        )
        print(f"✅ Spanish response: {response}")
        
        # Test with Tagalog/Filipino
        response = get_conversational_response(
            "Kumusta ka?",
            [],
            'tl'
        )
        print(f"✅ Tagalog response: {response}")
        
        return True
    except Exception as e:
        print(f"❌ Error testing conversational response: {e}")
        return False

def test_detailed_feedback():
    """Test detailed feedback generation"""
    print("\n📊 Testing detailed feedback...")
    
    try:
        feedback = get_detailed_feedback(
            "Phoneme analysis: Good pronunciation overall",
            "Hello world",
            "Hello world",
            [],
            'en'
        )
        print(f"✅ Detailed feedback: {feedback}")
        return True
    except Exception as e:
        print(f"❌ Error testing detailed feedback: {e}")
        return False

def test_filipino_tutor():
    """Test Filipino heritage tutor functionality"""
    print("\n🇵🇭 Testing Filipino heritage tutor...")
    
    try:
        from gemini_client import get_filipino_tutor_response
        
        response = get_filipino_tutor_response(
            "Kumusta ka?",
            "Starting a new conversation"
        )
        print(f"✅ Filipino tutor response: {response[:200]}...")
        return True
    except Exception as e:
        print(f"❌ Error testing Filipino tutor: {e}")
        return False

def main():
    """Run all tests"""
    print("🧪 Testing Gemini Integration")
    print("=" * 50)
    
    # Test health
    if not test_gemini_health():
        print("\n❌ Health check failed. Please check your API key and internet connection.")
        sys.exit(1)
    
    # Test conversational response
    if not test_conversational_response():
        print("\n❌ Conversational response test failed.")
        sys.exit(1)
    
    # Test detailed feedback
    if not test_detailed_feedback():
        print("\n❌ Detailed feedback test failed.")
        sys.exit(1)
    
    # Test Filipino tutor
    if not test_filipino_tutor():
        print("\n❌ Filipino tutor test failed.")
        sys.exit(1)
    
    print("\n🎉 All tests passed! Gemini integration is working correctly.")
    print("\nYou can now run the full application:")
    print("1. Start the Python API: python python_api.py")
    print("2. Start the Node.js server: cd server && npm start")
    print("3. Start the React client: cd client && npm start")

if __name__ == "__main__":
    main() 