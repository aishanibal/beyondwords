#!/usr/bin/env python3
"""
Fix the admin password issue
"""

import hashlib
import json
import os

def hash_password(password: str) -> str:
    """Hash password for storage"""
    return hashlib.sha256(password.encode()).hexdigest()

def fix_admin_password():
    """Fix the admin password to use 'admin123'"""
    print("🔧 Fixing admin password...")
    
    # The correct password hash for "admin123"
    correct_hash = hash_password("admin123")
    print(f"Correct hash for 'admin123': {correct_hash}")
    
    # Read current config
    if os.path.exists("admin_config.json"):
        with open("admin_config.json", 'r') as f:
            config = json.load(f)
        
        print(f"Current hash: {config.get('admin_password_hash', 'NOT FOUND')}")
        
        # Update the password hash
        config["admin_password_hash"] = correct_hash
        
        # Save the updated config
        with open("admin_config.json", 'w') as f:
            json.dump(config, f, indent=2)
        
        print("✅ Password hash updated to 'admin123'")
        
        # Test the password
        from admin_dashboard import AdminDashboard
        dashboard = AdminDashboard()
        
        # Test enable/disable functions
        print("\n🧪 Testing password verification...")
        enable_result = dashboard.enable_google_api_services("admin123")
        print(f"Enable test: {enable_result}")
        
        disable_result = dashboard.disable_google_api_services("admin123")
        print(f"Disable test: {disable_result}")
        
        # Re-enable for testing
        dashboard.enable_google_api_services("admin123")
        
    else:
        print("❌ admin_config.json not found")

if __name__ == "__main__":
    fix_admin_password() 