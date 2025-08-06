#!/usr/bin/env python3
"""
Admin Dashboard for TTS System
Controls TTS settings and provides admin features
"""

import os
import json
import hashlib
import time
from datetime import datetime
from typing import Dict, Any

class AdminDashboard:
    def __init__(self, config_file: str = "admin_config.json"):
        self.config_file = config_file
        self.load_config()
        
    def load_config(self):
        """Load admin configuration"""
        if os.path.exists(self.config_file):
            with open(self.config_file, 'r') as f:
                self.config = json.load(f)
        else:
            # Default configuration
            self.config = {
                "admin_password_hash": self.hash_password("admin123"),  # Change this!
                            "tts_settings": {
                "active_tts": "system",  # system, cloud, gemini
                "google_cloud_voice_model": "standard",  # standard, neural2, studio
                "cost_limit_per_day": 1.00,  # $1.00 per day
                "usage_tracking": True
            },
                "usage_stats": {
                    "daily_usage": {},
                    "total_cost": 0.0,
                    "last_reset": datetime.now().isoformat()
                },
                "admin_features": {
                    "enable_gemini_tts": False,
                    "enable_cost_tracking": True,
                    "enable_usage_analytics": True,
                    "enable_system_monitoring": True
                }
            }
            self.save_config()
    
    def save_config(self):
        """Save admin configuration"""
        with open(self.config_file, 'w') as f:
            json.dump(self.config, f, indent=2)
    
    def hash_password(self, password: str) -> str:
        """Hash password for storage"""
        return hashlib.sha256(password.encode()).hexdigest()
    
    def verify_password(self, password: str) -> bool:
        """Verify admin password"""
        return self.hash_password(password) == self.config["admin_password_hash"]
    
    def change_password(self, old_password: str, new_password: str) -> bool:
        """Change admin password"""
        if self.verify_password(old_password):
            self.config["admin_password_hash"] = self.hash_password(new_password)
            self.save_config()
            return True
        return False
    
    def get_tts_settings(self) -> Dict[str, Any]:
        """Get current TTS settings"""
        settings = self.config["tts_settings"]
        # Ensure active_tts is always present
        if "active_tts" not in settings:
            settings["active_tts"] = "system"
        return settings
    
    def update_tts_settings(self, settings: Dict[str, Any]) -> bool:
        """Update TTS settings"""
        print(f"🔧 Updating TTS settings: {settings}")
        self.config["tts_settings"].update(settings)
        print(f"🔧 New TTS settings: {self.config['tts_settings']}")
        self.save_config()
        return True
    
    def enable_gemini_tts(self, password: str) -> bool:
        """Enable expensive Gemini TTS (admin only)"""
        if not self.verify_password(password):
            return False
        
        self.config["tts_settings"]["gemini_enabled"] = True
        self.config["admin_features"]["enable_gemini_tts"] = True
        self.save_config()
        return True
    
    def disable_gemini_tts(self, password: str) -> bool:
        """Disable expensive Gemini TTS"""
        if not self.verify_password(password):
            return False
        
        self.config["tts_settings"]["gemini_enabled"] = False
        self.config["admin_features"]["enable_gemini_tts"] = False
        self.save_config()
        return True
    
    def track_usage(self, tts_type: str, cost: float = 0.0):
        """Track TTS usage and costs"""
        if not self.config["tts_settings"]["usage_tracking"]:
            return
        
        today = datetime.now().strftime("%Y-%m-%d")
        
        if today not in self.config["usage_stats"]["daily_usage"]:
            self.config["usage_stats"]["daily_usage"][today] = {
                "google_cloud": 0,
                "gemini": 0,
                "system": 0,
                "total_cost": 0.0
            }
        
        self.config["usage_stats"]["daily_usage"][today][tts_type] += 1
        self.config["usage_stats"]["daily_usage"][today]["total_cost"] += cost
        self.config["usage_stats"]["total_cost"] += cost
        
        self.save_config()
    
    def get_usage_stats(self) -> Dict[str, Any]:
        """Get usage statistics"""
        return self.config["usage_stats"]
    
    def reset_daily_usage(self):
        """Reset daily usage counters"""
        self.config["usage_stats"]["daily_usage"] = {}
        self.config["usage_stats"]["last_reset"] = datetime.now().isoformat()
        self.save_config()
    
    def get_system_status(self) -> Dict[str, Any]:
        """Get system status information"""
        return {
            "current_tts": self.config["tts_settings"]["default_tts"],
            "gemini_enabled": self.config["tts_settings"]["gemini_enabled"],
            "cost_tracking": self.config["tts_settings"]["usage_tracking"],
            "daily_cost_limit": self.config["tts_settings"]["cost_limit_per_day"],
            "total_cost": self.config["usage_stats"]["total_cost"],
            "last_reset": self.config["usage_stats"]["last_reset"]
        }
    
    def is_gemini_allowed(self) -> bool:
        """Check if Gemini TTS is allowed"""
        return self.config["tts_settings"]["gemini_enabled"]
    
    def get_cost_effective_tts(self) -> str:
        """Get the cost-effective TTS system to use"""
        return self.config["tts_settings"]["default_tts"]

def main():
    """Admin Dashboard CLI"""
    dashboard = AdminDashboard()
    
    print("🔐 Admin Dashboard")
    print("=" * 50)
    
    # Simple CLI interface
    while True:
        print("\nOptions:")
        print("1. View System Status")
        print("2. View Usage Statistics")
        print("3. Enable Gemini TTS")
        print("4. Disable Gemini TTS")
        print("5. Change TTS Settings")
        print("6. Reset Daily Usage")
        print("7. Change Admin Password")
        print("8. Exit")
        
        choice = input("\nEnter choice (1-8): ")
        
        if choice == "1":
            status = dashboard.get_system_status()
            print("\n📊 System Status:")
            for key, value in status.items():
                print(f"  {key}: {value}")
        
        elif choice == "2":
            stats = dashboard.get_usage_stats()
            print("\n📈 Usage Statistics:")
            print(f"  Total Cost: ${stats['total_cost']:.2f}")
            print(f"  Last Reset: {stats['last_reset']}")
            if stats['daily_usage']:
                print("  Daily Usage:")
                for date, usage in stats['daily_usage'].items():
                    print(f"    {date}: {usage}")
        
        elif choice == "3":
            password = input("Enter admin password: ")
            if dashboard.enable_gemini_tts(password):
                print("✅ Gemini TTS enabled")
            else:
                print("❌ Invalid password")
        
        elif choice == "4":
            password = input("Enter admin password: ")
            if dashboard.disable_gemini_tts(password):
                print("✅ Gemini TTS disabled")
            else:
                print("❌ Invalid password")
        
        elif choice == "5":
            print("\nTTS Settings:")
            settings = dashboard.get_tts_settings()
            for key, value in settings.items():
                print(f"  {key}: {value}")
            
            new_default = input("New default TTS (google_cloud/system): ")
            if new_default in ["google_cloud", "system"]:
                dashboard.update_tts_settings({"default_tts": new_default})
                print("✅ Settings updated")
        
        elif choice == "6":
            dashboard.reset_daily_usage()
            print("✅ Daily usage reset")
        
        elif choice == "7":
            old_password = input("Enter current password: ")
            new_password = input("Enter new password: ")
            if dashboard.change_password(old_password, new_password):
                print("✅ Password changed")
            else:
                print("❌ Invalid current password")
        
        elif choice == "8":
            print("👋 Goodbye!")
            break
        
        else:
            print("❌ Invalid choice")

if __name__ == "__main__":
    main() 