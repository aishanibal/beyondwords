#!/usr/bin/env python3
"""
Simple test for Google API toggle
"""

import json
import os

def test_toggle():
    """Test the toggle functionality"""
    print("🧪 Simple Google API Toggle Test")
    print("=" * 40)
    
    # Test 1: Check current state
    print("\n1. Reading current config...")
    if os.path.exists("admin_config.json"):
        with open("admin_config.json", 'r') as f:
            config = json.load(f)
        
        google_api_settings = config.get("google_api_settings", {})
        current_state = google_api_settings.get("services_enabled", True)
        print(f"   Current state: {current_state}")
        
        # Test 2: Disable
        print("\n2. Disabling Google API services...")
        google_api_settings["services_enabled"] = False
        config["google_api_settings"] = google_api_settings
        
        with open("admin_config.json", 'w') as f:
            json.dump(config, f, indent=2)
        
        print("   ✅ Disabled")
        
        # Test 3: Check disabled state
        print("\n3. Checking disabled state...")
        from gemini_client import is_google_api_enabled
        disabled_state = is_google_api_enabled()
        print(f"   Google API enabled: {disabled_state}")
        
        # Test 4: Test function behavior
        print("\n4. Testing function behavior when disabled...")
        from gemini_client import get_conversational_response
        response = get_conversational_response("Hello", [], "en")
        print(f"   Response: {response}")
        
        # Test 5: Re-enable
        print("\n5. Re-enabling Google API services...")
        google_api_settings["services_enabled"] = True
        config["google_api_settings"] = google_api_settings
        
        with open("admin_config.json", 'w') as f:
            json.dump(config, f, indent=2)
        
        print("   ✅ Re-enabled")
        
        # Test 6: Check enabled state
        print("\n6. Checking enabled state...")
        enabled_state = is_google_api_enabled()
        print(f"   Google API enabled: {enabled_state}")
        
    else:
        print("❌ admin_config.json not found")

if __name__ == "__main__":
    test_toggle() 