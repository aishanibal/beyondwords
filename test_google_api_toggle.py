#!/usr/bin/env python3
"""
Test script for Google API toggle functionality
"""

from admin_dashboard import AdminDashboard
from gemini_client import is_google_api_enabled, get_conversational_response, get_translation
from tts_synthesizer_admin_controlled import AdminControlledTTSSynthesizer

def test_google_api_toggle():
    """Test the Google API toggle functionality"""
    print("🧪 Testing Google API Toggle Functionality")
    print("=" * 50)
    
    # Initialize admin dashboard
    dashboard = AdminDashboard()
    
    # Test 1: Check initial state
    print("\n1. Testing initial state...")
    initial_state = dashboard.is_google_api_enabled()
    print(f"   Google API enabled: {initial_state}")
    
    # Test 2: Disable Google API services
    print("\n2. Disabling Google API services...")
    success = dashboard.disable_google_api_services("admin123")
    print(f"   Disable success: {success}")
    
    # Test 3: Check disabled state
    print("\n3. Checking disabled state...")
    disabled_state = dashboard.is_google_api_enabled()
    print(f"   Google API enabled: {disabled_state}")
    
    # Test 4: Test Gemini functions when disabled
    print("\n4. Testing Gemini functions when disabled...")
    print("   Testing get_conversational_response...")
    response = get_conversational_response("Hello", [], "en")
    print(f"   Response: {response}")
    
    print("   Testing get_translation...")
    translation = get_translation("Hello", "en", "es")
    print(f"   Translation: {translation}")
    
    # Test 5: Test TTS when disabled
    print("\n5. Testing TTS when disabled...")
    tts = AdminControlledTTSSynthesizer()
    result = tts.synthesize_speech("Hello world", "en", "test_output.wav")
    print(f"   TTS result: {result}")
    
    # Test 6: Enable Google API services
    print("\n6. Enabling Google API services...")
    success = dashboard.enable_google_api_services("admin123")
    print(f"   Enable success: {success}")
    
    # Test 7: Check enabled state
    print("\n7. Checking enabled state...")
    enabled_state = dashboard.is_google_api_enabled()
    print(f"   Google API enabled: {enabled_state}")
    
    # Test 8: Test system status
    print("\n8. Testing system status...")
    status = dashboard.get_system_status()
    print(f"   System status: {status}")
    
    print("\n✅ Google API toggle test completed!")

if __name__ == "__main__":
    test_google_api_toggle() 