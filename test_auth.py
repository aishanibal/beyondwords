#!/usr/bin/env python3
"""
Simple test script to check authentication and detailed breakdown functionality
"""

import requests
import json

def test_detailed_breakdown_without_auth():
    """Test the detailed breakdown endpoint without authentication"""
    print("Testing detailed breakdown without authentication...")
    
    url = "http://localhost:4000/api/detailed_breakdown"
    data = {
        "llm_response": "Hello, how are you?",
        "language": "en",
        "user_level": "beginner",
        "user_topics": [],
        "formality": "friendly",
        "feedback_language": "en"
    }
    
    try:
        response = requests.post(url, json=data)
        print(f"Status: {response.status_code}")
        print(f"Response: {response.text}")
    except Exception as e:
        print(f"Error: {e}")

def test_detailed_breakdown_with_fake_auth():
    """Test with a fake JWT token"""
    print("\nTesting detailed breakdown with fake JWT token...")
    
    url = "http://localhost:4000/api/detailed_breakdown"
    data = {
        "llm_response": "Hello, how are you?",
        "language": "en",
        "user_level": "beginner",
        "user_topics": [],
        "formality": "friendly",
        "feedback_language": "en"
    }
    headers = {
        "Authorization": "Bearer fake.jwt.token"
    }
    
    try:
        response = requests.post(url, json=data, headers=headers)
        print(f"Status: {response.status_code}")
        print(f"Response: {response.text}")
    except Exception as e:
        print(f"Error: {e}")

def test_python_api_direct():
    """Test the Python API directly (bypasses authentication)"""
    print("\nTesting Python API directly...")
    
    url = "http://localhost:5000/detailed_breakdown"
    data = {
        "llm_response": "Hello, how are you?",
        "language": "en",
        "user_level": "beginner",
        "user_topics": [],
        "formality": "friendly",
        "feedback_language": "en"
    }
    
    try:
        response = requests.post(url, json=data)
        print(f"Status: {response.status_code}")
        if response.status_code == 200:
            print("✅ Python API is working correctly!")
            print(f"Response preview: {response.text[:200]}...")
        else:
            print(f"❌ Python API error: {response.text}")
    except Exception as e:
        print(f"❌ Python API connection error: {e}")

if __name__ == "__main__":
    print("🔍 Authentication and API Test")
    print("=" * 50)
    
    test_python_api_direct()
    test_detailed_breakdown_without_auth()
    test_detailed_breakdown_with_fake_auth()
    
    print("\n" + "=" * 50)
    print("💡 If the Python API works but the Express API doesn't, the issue is authentication.")
    print("💡 The user needs to be logged in to use the 'Get Detailed Explanation' button.") 