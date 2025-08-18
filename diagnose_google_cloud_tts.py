#!/usr/bin/env python3
"""
Diagnostic script for Google Cloud TTS API issues
"""

import os
import requests
import json

def diagnose_google_cloud_tts():
    """Diagnose Google Cloud TTS API issues"""
    print("🔍 Diagnosing Google Cloud TTS API Issues")
    print("=" * 50)
    
    # Check 1: API Key
    print("\n1. Checking API Key...")
    api_key = (
        os.getenv('GOOGLE_CLOUD_TTS_API_KEY')
        or os.getenv('GOOGLE_AI_API_KEY')
        or os.getenv('GEMINI_API_KEY')
        or os.getenv('GOOGLE_API_KEY')
    )
    
    if api_key:
        print(f"✅ API Key found: {api_key[:8]}...")
        print(f"   Length: {len(api_key)} characters")
    else:
        print("❌ No API key found in environment variables")
        print("   Set one of: GOOGLE_CLOUD_TTS_API_KEY, GOOGLE_AI_API_KEY, GEMINI_API_KEY, GOOGLE_API_KEY")
        return
    
    # Check 2: Test API key with a simple request
    print("\n2. Testing API key with Google Cloud APIs...")
    
    # Test with a simple API call to check if the key works
    test_url = f"https://www.googleapis.com/discovery/v1/apis?key={api_key}"
    try:
        response = requests.get(test_url)
        print(f"   Discovery API response: {response.status_code}")
        if response.status_code == 200:
            print("✅ API key is valid")
        else:
            print(f"❌ API key might be invalid: {response.status_code}")
    except Exception as e:
        print(f"❌ Error testing API key: {e}")
    
    # Check 3: Test Text-to-Speech API specifically
    print("\n3. Testing Text-to-Speech API...")
    
    url = f"https://texttospeech.googleapis.com/v1/text:synthesize?key={api_key}"
    payload = {
        "input": {"text": "Hello world"},
        "voice": {
            "languageCode": "en-US",
            "ssmlGender": "NEUTRAL"
        },
        "audioConfig": {
            "audioEncoding": "MP3"
        }
    }
    
    try:
        response = requests.post(url, json=payload)
        print(f"   TTS API response: {response.status_code}")
        
        if response.status_code == 200:
            print("✅ Text-to-Speech API is working!")
            data = response.json()
            if 'audioContent' in data:
                print("✅ Audio content received successfully")
            else:
                print("❌ No audio content in response")
        elif response.status_code == 403:
            print("❌ 403 Forbidden - API might be disabled or key restricted")
            try:
                error_data = response.json()
                print(f"   Error details: {json.dumps(error_data, indent=2)}")
            except:
                print(f"   Error response: {response.text}")
        else:
            print(f"❌ Unexpected status code: {response.status_code}")
            print(f"   Response: {response.text}")
            
    except Exception as e:
        print(f"❌ Error testing TTS API: {e}")
    
    # Check 4: Environment variables
    print("\n4. Checking environment variables...")
    env_vars = [
        'GOOGLE_CLOUD_TTS_API_KEY',
        'GOOGLE_AI_API_KEY', 
        'GEMINI_API_KEY',
        'GOOGLE_API_KEY'
    ]
    
    for var in env_vars:
        value = os.getenv(var)
        if value:
            print(f"✅ {var}: {value[:8]}...")
        else:
            print(f"❌ {var}: Not set")
    
    # Check 5: Project ID from error message
    print("\n5. Project ID Analysis...")
    print("   From error messages, project ID appears to be: 1018295957626")
    print("   Make sure this is the correct project where you enabled the API")
    
    # Check 6: Recommendations
    print("\n6. Recommendations:")
    print("   a) Verify the API is enabled in the correct project")
    print("   b) Check API key restrictions in Google Cloud Console")
    print("   c) Wait 5-10 minutes after enabling the API")
    print("   d) Try using a different API key")
    print("   e) Check billing is enabled for the project")

if __name__ == "__main__":
    diagnose_google_cloud_tts() 