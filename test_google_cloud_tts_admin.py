#!/usr/bin/env python3
"""
Test script to verify Google Cloud TTS works when changed from admin panel
"""

from admin_dashboard import AdminDashboard
from tts_synthesizer_admin_controlled import AdminControlledTTSSynthesizer
import os

def test_google_cloud_tts_admin():
    """Test Google Cloud TTS with admin panel integration"""
    print("🧪 Testing Google Cloud TTS with Admin Panel Integration")
    print("=" * 60)
    
    # Initialize admin dashboard
    dashboard = AdminDashboard()
    
    # Test 1: Check current admin settings
    print("\n1. Checking current admin settings...")
    tts_settings = dashboard.get_tts_settings()
    google_api_settings = dashboard.get_google_api_settings()
    
    print(f"   TTS Settings: {tts_settings}")
    print(f"   Google API Settings: {google_api_settings}")
    print(f"   Active TTS: {tts_settings.get('active_tts', 'system')}")
    print(f"   Google API Enabled: {dashboard.is_google_api_enabled()}")
    
    # Test 2: Test TTS synthesizer with current settings
    print("\n2. Testing TTS synthesizer with current settings...")
    tts = AdminControlledTTSSynthesizer()
    
    test_text = "Hello world! This is a test of Google Cloud TTS from the admin panel."
    result = tts.synthesize_speech(test_text, 'en', 'test_google_cloud_admin.wav')
    
    print(f"   TTS Result: {result}")
    if result:
        print(f"   ✅ TTS successful: {result}")
        if os.path.exists(result):
            print(f"   ✅ File exists: {os.path.getsize(result)} bytes")
        else:
            print(f"   ❌ File does not exist: {result}")
    else:
        print(f"   ❌ TTS failed")
    
    # Test 3: Change TTS system to Google Cloud via admin panel
    print("\n3. Changing TTS system to Google Cloud via admin panel...")
    success = dashboard.update_tts_settings({"active_tts": "cloud"})
    print(f"   Update success: {success}")
    
    # Test 4: Test TTS synthesizer with Google Cloud setting
    print("\n4. Testing TTS synthesizer with Google Cloud setting...")
    tts = AdminControlledTTSSynthesizer()
    result = tts.synthesize_speech(test_text, 'en', 'test_google_cloud_admin_2.wav')
    
    print(f"   TTS Result: {result}")
    if result:
        print(f"   ✅ TTS successful: {result}")
        if os.path.exists(result):
            print(f"   ✅ File exists: {os.path.getsize(result)} bytes")
        else:
            print(f"   ❌ File does not exist: {result}")
    else:
        print(f"   ❌ TTS failed")
    
    # Test 5: Change back to system TTS
    print("\n5. Changing back to system TTS...")
    success = dashboard.update_tts_settings({"active_tts": "system"})
    print(f"   Update success: {success}")
    
    # Test 6: Test system TTS
    print("\n6. Testing system TTS...")
    result = tts.synthesize_speech(test_text, 'en', 'test_system_tts_admin.wav')
    
    print(f"   TTS Result: {result}")
    if result:
        print(f"   ✅ TTS successful: {result}")
        if os.path.exists(result):
            print(f"   ✅ File exists: {os.path.getsize(result)} bytes")
        else:
            print(f"   ❌ File does not exist: {result}")
    else:
        print(f"   ❌ TTS failed")
    
    # Test 7: Test with different languages
    print("\n7. Testing Google Cloud TTS with different languages...")
    dashboard.update_tts_settings({"active_tts": "cloud"})
    tts = AdminControlledTTSSynthesizer()
    
    languages = ['en', 'es', 'fr', 'zh', 'ja', 'ko']
    for lang in languages:
        print(f"   Testing language: {lang}")
        result = tts.synthesize_speech(f"Hello in {lang}", lang, f'test_{lang}_admin.wav')
        if result:
            print(f"   ✅ {lang}: {result}")
        else:
            print(f"   ❌ {lang}: Failed")
    
    print("\n✅ Google Cloud TTS Admin Panel Test Complete!")

if __name__ == "__main__":
    test_google_cloud_tts_admin() 