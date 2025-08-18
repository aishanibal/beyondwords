#!/usr/bin/env python3
"""
Test API key restrictions for Google Cloud TTS
"""

import os
import requests

def test_api_key_restrictions():
    """Test if API key restrictions are causing the issue"""
    print("🔑 Testing API Key Restrictions")
    print("=" * 40)
    
    api_key = os.getenv('GOOGLE_API_KEY')
    if not api_key:
        print("❌ No GOOGLE_API_KEY found")
        return
    
    print(f"✅ Using API key: {api_key[:8]}...")
    
    # Test 1: Discovery API (should work)
    print("\n1. Testing Discovery API...")
    discovery_url = f"https://www.googleapis.com/discovery/v1/apis?key={api_key}"
    try:
        response = requests.get(discovery_url)
        print(f"   Status: {response.status_code}")
        if response.status_code == 200:
            print("✅ Discovery API works - API key is valid")
        else:
            print(f"❌ Discovery API failed: {response.status_code}")
    except Exception as e:
        print(f"❌ Error: {e}")
    
    # Test 2: Text-to-Speech API
    print("\n2. Testing Text-to-Speech API...")
    tts_url = f"https://texttospeech.googleapis.com/v1/text:synthesize?key={api_key}"
    payload = {
        "input": {"text": "Hello world"},
        "voice": {"languageCode": "en-US", "ssmlGender": "NEUTRAL"},
        "audioConfig": {"audioEncoding": "MP3"}
    }
    
    try:
        response = requests.post(tts_url, json=payload)
        print(f"   Status: {response.status_code}")
        
        if response.status_code == 200:
            print("✅ Text-to-Speech API works!")
            return True
        elif response.status_code == 403:
            print("❌ 403 Forbidden - API disabled or key restricted")
            print("   Solution: Check API key restrictions in Google Cloud Console")
            return False
        else:
            print(f"❌ Unexpected status: {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

if __name__ == "__main__":
    test_api_key_restrictions() 