#!/usr/bin/env python3
"""
Interactive test script for Gemini client
"""

import os
from gemini_client import FilipinoHeritageTutor

def main():
    print("🧪 Interactive Gemini Client Test")
    print("=" * 40)
    
    # Check if API key is set
    if not os.getenv("GOOGLE_API_KEY"):
        print("❌ GOOGLE_API_KEY environment variable not set!")
        print("Please set your Google API key:")
        print("export GOOGLE_API_KEY='your-api-key-here'")
        return
    
    # Create tutor instance
    print("🔧 Creating Filipino Heritage Tutor...")
    tutor = FilipinoHeritageTutor()
    
    # Test API connection
    print("🔍 Testing API connection...")
    if not tutor.test_api_connection():
        print("❌ API connection failed. Please check your API key.")
        return
    
    print("✅ API connection successful!")
    print("\n💬 Start chatting! Type 'quit' to exit.")
    print("-" * 40)
    
    context = ""
    turn = 1
    
    while True:
        try:
            # Get user input
            user_input = input(f"\nTurn {turn} - You: ").strip()
            
            if user_input.lower() in ['quit', 'exit', 'q']:
                print("👋 Goodbye!")
                break
            
            if not user_input:
                print("Please say something!")
                continue
            
            # Get response
            print("🤖 AI is thinking...")
            response = tutor.provide_conversational_response(user_input, context)
            
            print(f"\nTutor: {response}")
            
            # Update context for next turn
            context += f"User: {user_input}\nTutor: {response}\n"
            turn += 1
            
        except KeyboardInterrupt:
            print("\n👋 Goodbye!")
            break
        except Exception as e:
            print(f"❌ Error: {e}")
            print("Please try again.")

if __name__ == "__main__":
    main() 