#!/usr/bin/env python3
"""
Setup script for configuring paid API keys for BeyondWords TTS
"""

import os
import sys

def check_current_api_keys():
    """Check which API keys are currently configured"""
    print("🔍 Checking current API key configuration...")
    
    google_api_key = os.getenv('GOOGLE_API_KEY')
    google_ai_api_key = os.getenv('GOOGLE_AI_API_KEY')
    gemini_api_key = os.getenv('GEMINI_API_KEY')
    
    print(f"GOOGLE_API_KEY: {'✅ Set' if google_api_key else '❌ Not set'}")
    print(f"GOOGLE_AI_API_KEY: {'✅ Set' if google_ai_api_key else '❌ Not set'}")
    print(f"GEMINI_API_KEY: {'✅ Set' if gemini_api_key else '❌ Not set'}")
    
    if google_api_key:
        print(f"   Current GOOGLE_API_KEY starts with: {google_api_key[:8]}...")
    if google_ai_api_key:
        print(f"   Current GOOGLE_AI_API_KEY starts with: {google_ai_api_key[:8]}...")
    if gemini_api_key:
        print(f"   Current GEMINI_API_KEY starts with: {gemini_api_key[:8]}...")
    
    return google_api_key, google_ai_api_key, gemini_api_key

def print_setup_instructions():
    """Print instructions for setting up paid API keys"""
    print("\n" + "="*60)
    print("🚀 SETTING UP PAID API KEYS FOR BEYONDWORDS TTS")
    print("="*60)
    
    print("\n📋 CURRENT ISSUE:")
    print("   Your current API key is hitting the free tier quota limit (15 requests/day)")
    print("   To use paid TTS services, you need a Google Cloud project with billing enabled")
    
    print("\n🔧 SOLUTION:")
    print("   1. Create a Google Cloud project with billing enabled")
    print("   2. Enable the Gemini API in that project")
    print("   3. Create a new API key from that project")
    print("   4. Set it as GOOGLE_AI_API_KEY (higher priority)")
    
    print("\n📝 STEP-BY-STEP INSTRUCTIONS:")
    print("   1. Go to https://console.cloud.google.com/")
    print("   2. Create a new project or select existing project")
    print("   3. Enable billing for the project")
    print("   4. Enable the 'Gemini API' in APIs & Services")
    print("   5. Go to APIs & Services > Credentials")
    print("   6. Create a new API key")
    print("   7. Copy the new API key")
    
    print("\n🔑 SETTING THE PAID API KEY:")
    print("   Run these commands in your terminal:")
    print("   export GOOGLE_AI_API_KEY='your-new-paid-api-key'")
    print("   echo 'export GOOGLE_AI_API_KEY=\"your-new-paid-api-key\"' >> ~/.bashrc")
    print("   source ~/.bashrc")
    
    print("\n✅ VERIFICATION:")
    print("   After setting the new key, run this script again to verify")
    print("   The system will use GOOGLE_AI_API_KEY with higher priority")

def test_api_key_quota():
    """Test if the current API key is hitting quota limits"""
    print("\n🧪 Testing API key quota...")
    
    try:
        from gemini_client import get_conversational_response
        response = get_conversational_response("Hello", "en")
        if response:
            print("✅ API key is working (no quota issues)")
            return True
        else:
            print("❌ API key returned no response")
            return False
    except Exception as e:
        error_msg = str(e).lower()
        if 'quota' in error_msg or '429' in error_msg or 'resource_exhausted' in error_msg:
            print("❌ API key is hitting quota limits (free tier)")
            print(f"   Error: {e}")
            return False
        else:
            print(f"❌ API key error: {e}")
            return False

def main():
    """Main setup function"""
    print("🔧 BeyondWords TTS API Key Setup")
    print("="*40)
    
    # Check current configuration
    google_api_key, google_ai_api_key, gemini_api_key = check_current_api_keys()
    
    # Test current API key
    is_working = test_api_key_quota()
    
    if not is_working:
        print_setup_instructions()
    else:
        print("\n✅ Your API key is working correctly!")
        print("   If you want to use paid services, follow the setup instructions above")
    
    print("\n" + "="*60)
    print("💡 TIP: Use GOOGLE_AI_API_KEY for paid services (higher priority)")
    print("   The system checks API keys in this order:")
    print("   1. GOOGLE_AI_API_KEY (paid services)")
    print("   2. GEMINI_API_KEY")
    print("   3. GOOGLE_API_KEY (free tier)")
    print("="*60)

if __name__ == "__main__":
    main() 