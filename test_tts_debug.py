#!/usr/bin/env python3
"""
Test script to verify TTS debug functionality
"""

import requests
import json
import time

def test_tts_debug():
    """Test TTS debug functionality"""
    
    # Test data
    test_cases = [
        {
            "text": "Hello, this is a test message for TTS debugging.",
            "language": "en",
            "description": "English test"
        },
        {
            "text": "Hola, esto es un mensaje de prueba para depurar TTS.",
            "language": "es", 
            "description": "Spanish test"
        },
        {
            "text": "Bonjour, ceci est un message de test pour déboguer TTS.",
            "language": "fr",
            "description": "French test"
        }
    ]
    
    print("🎯 Testing TTS Debug Functionality")
    print("=" * 50)
    
    for i, test_case in enumerate(test_cases, 1):
        print(f"\n📝 Test {i}: {test_case['description']}")
        print(f"   Text: {test_case['text'][:50]}...")
        print(f"   Language: {test_case['language']}")
        
        try:
            # Call the TTS endpoint
            response = requests.post(
                'http://localhost:4000/api/tts-test',
                json={
                    'text': test_case['text'],
                    'language': test_case['language']
                },
                timeout=30
            )
            
            if response.status_code == 200:
                data = response.json()
                print(f"   ✅ Success!")
                print(f"   📊 Response data:")
                print(f"      - Success: {data.get('success')}")
                print(f"      - TTS URL: {data.get('ttsUrl', 'None')}")
                
                # Check debug info
                debug = data.get('debug', {})
                if debug:
                    print(f"   🎯 Debug Info:")
                    print(f"      - Service Used: {debug.get('service_used', 'unknown')}")
                    print(f"      - Fallback Reason: {debug.get('fallback_reason', 'none')}")
                    print(f"      - Cost Estimate: ${debug.get('cost_estimate', 'unknown')}")
                    print(f"      - Request ID: {debug.get('request_id', 'unknown')}")
                    
                    # Check admin settings
                    admin_settings = debug.get('admin_settings', {})
                    if admin_settings:
                        print(f"      - Admin Settings: {admin_settings}")
                else:
                    print(f"   ⚠️  No debug info found")
            else:
                print(f"   ❌ Error: {response.status_code}")
                print(f"   📄 Response: {response.text}")
                
        except requests.exceptions.RequestException as e:
            print(f"   ❌ Request failed: {e}")
        except Exception as e:
            print(f"   ❌ Unexpected error: {e}")
        
        # Wait between tests
        if i < len(test_cases):
            print("   ⏳ Waiting 2 seconds...")
            time.sleep(2)
    
    print("\n" + "=" * 50)
    print("🎯 TTS Debug Test Complete!")

if __name__ == "__main__":
    test_tts_debug()

