import sys
from gemini_client import (
    create_tutor,
    is_gemini_ready,
    TagalogHeritageTutor
)

def main():
    if not is_gemini_ready():
        print("Gemini is not ready. Check your API key and installation.")
        sys.exit(1)

    print("=== Gemini Prompt Tester ===")
    language = input("Language code (e.g. 'tl', 'en'): ") or "tl"
    user_level = input("User level (beginner/elementary/intermediate/advanced/fluent): ") or "beginner"
    user_topics = input("User topics (comma-separated, optional): ").split(',') if input else []
    user_topics = [t.strip() for t in user_topics if t.strip()]
    
    tutor = create_tutor(language, user_level, user_topics)
    chat_history = []
    
    while True:
        print("\n" + "="*50)
        # Show recent context before menu
        if chat_history:
            print("Recent context:")
            for msg in chat_history[-4:]:
                print(f"{msg['sender']}: {msg['text']}")
        else:
            print("No previous conversation.")
        print("\nChoose function to test:")
        print("1. Conversational Response")
        print("2. Feedback (on last user input)")
        print("3. Suggestions (based on recent context)")
        print("4. Checker (on last exchange)")
        print("5. Show Chat History")
        print("6. Clear Chat History")
        print("7. Exit")
        
        choice = input("\nEnter choice (1-7): ").strip()
        
        if choice == "1":
            user_input = input("User input: ")
            context = "\n".join([f"{msg['sender']}: {msg['text']}" for msg in chat_history[-4:]]) if chat_history else ""
            print("\n--- Conversational Response ---")
            conv_response = tutor.get_conversational_response(user_input, context)
            print(f"AI: {conv_response}")
            # Add to chat history
            chat_history.append({"sender": "User", "text": user_input})
            chat_history.append({"sender": "AI", "text": conv_response})
        
        elif choice == "2":
            if not chat_history or chat_history[-1]["sender"] != "User":
                # Find last user input
                last_user = next((msg for msg in reversed(chat_history) if msg["sender"] == "User"), None)
            else:
                last_user = chat_history[-1]
            if not last_user:
                print("No user input found in chat history.")
                continue
            context = "\n".join([f"{msg['sender']}: {msg['text']}" for msg in chat_history[-4:]])
            print("\n--- Feedback (on last user input) ---")
            # Future-proof: if TagalogHeritageTutor-specific feedback is needed, check type here
            if isinstance(tutor, TagalogHeritageTutor):
                feedback = tutor.get_detailed_feedback(last_user["text"], context)
            else:
                feedback = tutor.get_detailed_feedback(last_user["text"], context)
            print(feedback)
        
        elif choice == "3":
            context = "\n".join([f"{msg['sender']}: {msg['text']}" for msg in chat_history[-4:]]) if chat_history else "No previous conversation"
            print("\n--- Suggestions (based on recent context) ---")
            # Future-proof: if TagalogHeritageTutor-specific suggestions are needed, check type here
            if isinstance(tutor, TagalogHeritageTutor):
                suggestions = tutor.get_suggestions(context)
            else:
                suggestions = tutor.get_suggestions(context)
            for i, suggestion in enumerate(suggestions, 1):
                print(f"{i}. {suggestion['text']} - {suggestion['translation']}")
        
        elif choice == "4":
            # Use last user input and last AI response
            last_user = next((msg for msg in reversed(chat_history) if msg["sender"] == "User"), None)
            last_ai = next((msg for msg in reversed(chat_history) if msg["sender"] == "AI"), None)
            if not last_user or not last_ai:
                print("Not enough conversation history for checker (need both user and AI messages).")
                continue
            context = "\n".join([f"{msg['sender']}: {msg['text']}" for msg in chat_history[-4:]])
            print("\n--- Original Conversational Response ---")
            print(f"AI: {last_ai['text']}")
            print("\n--- Checker Response ---")
            checked_response = tutor.check_and_fix_response(last_user["text"], last_ai["text"])
            print(f"Checked: {checked_response}")
            # Add checked response to chat history
            chat_history.append({"sender": "AI", "text": checked_response})
        
        elif choice == "5":
            print("\n--- Chat History ---")
            if not chat_history:
                print("No conversation history yet.")
            else:
                for i, msg in enumerate(chat_history, 1):
                    print(f"{i}. {msg['sender']}: {msg['text']}")
        
        elif choice == "6":
            chat_history = []
            print("Chat history cleared!")
        
        elif choice == "7":
            print("Goodbye!")
            break
        
        else:
            print("Invalid choice. Please enter 1-7.")

if __name__ == "__main__":
    main() 