#!/usr/bin/env python3
"""
Test script to verify admin panel TTS system switching
"""

from admin_dashboard import AdminDashboard
import json

def test_admin_panel_tts_switch():
    """Test admin panel TTS system switching"""
    print("🧪 Testing Admin Panel TTS System Switching")
    print("=" * 50)
    
    # Initialize admin dashboard
    dashboard = AdminDashboard()
    
    # Test 1: Check initial state
    print("\n1. Checking initial state...")
    initial_settings = dashboard.get_tts_settings()
    print(f"   Initial active_tts: {initial_settings.get('active_tts', 'system')}")
    
    # Test 2: Switch to System TTS
    print("\n2. Switching to System TTS...")
    success = dashboard.update_tts_settings({"active_tts": "system"})
    print(f"   Update success: {success}")
    
    settings = dashboard.get_tts_settings()
    print(f"   New active_tts: {settings.get('active_tts', 'system')}")
    
    # Test 3: Switch to Google Cloud TTS
    print("\n3. Switching to Google Cloud TTS...")
    success = dashboard.update_tts_settings({"active_tts": "cloud"})
    print(f"   Update success: {success}")
    
    settings = dashboard.get_tts_settings()
    print(f"   New active_tts: {settings.get('active_tts', 'system')}")
    
    # Test 4: Switch to Gemini TTS
    print("\n4. Switching to Gemini TTS...")
    success = dashboard.update_tts_settings({"active_tts": "gemini"})
    print(f"   Update success: {success}")
    
    settings = dashboard.get_tts_settings()
    print(f"   New active_tts: {settings.get('active_tts', 'system')}")
    
    # Test 5: Switch back to System TTS
    print("\n5. Switching back to System TTS...")
    success = dashboard.update_tts_settings({"active_tts": "system"})
    print(f"   Update success: {success}")
    
    settings = dashboard.get_tts_settings()
    print(f"   New active_tts: {settings.get('active_tts', 'system')}")
    
    # Test 6: Check admin config file
    print("\n6. Checking admin config file...")
    try:
        with open("admin_config.json", "r") as f:
            config = json.load(f)
        print(f"   Config file active_tts: {config.get('tts_settings', {}).get('active_tts', 'system')}")
    except Exception as e:
        print(f"   Error reading config file: {e}")
    
    # Test 7: Test invalid TTS system
    print("\n7. Testing invalid TTS system...")
    success = dashboard.update_tts_settings({"active_tts": "invalid"})
    print(f"   Update success: {success}")
    
    settings = dashboard.get_tts_settings()
    print(f"   active_tts after invalid: {settings.get('active_tts', 'system')}")
    
    print("\n✅ Admin Panel TTS System Switching Test Complete!")

if __name__ == "__main__":
    test_admin_panel_tts_switch() 