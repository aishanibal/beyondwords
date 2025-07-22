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

    print("Welcome to the Gemini Language Tutor test!")
    language_code = input("Enter language code (e.g., 'ja' for Japanese): ").strip()
    user_level = input("Enter user level (beginner/elementary/intermediate/advanced/fluent): ").strip()
    feedback_language = input("Enter feedback language (e.g., 'English', 'Japanese'): ").strip()
    print("Select closeness level:")
    print("  intimate  - Intimate/Familiar")
    print("  friendly  - Friendly/Peer")
    print("  respectful - Respectful/Polite")
    print("  formal    - Humble/Very Formal")
    print("  distant   - Distant/Neutral")
    user_closeness = input("Enter closeness level: ").strip()
    topics_input = input("Enter preferred topics (comma-separated, or leave blank for none): ").strip()
    user_topics = [t.strip() for t in topics_input.split(',')] if topics_input else []

    tutor = create_tutor(language_code, user_level, user_topics)
    tutor.feedback_language = feedback_language
    tutor.user_closeness = user_closeness
    tutor.user_topics = user_topics

    chat_history = []
    last_ai_response = None
    last_user_input = None
    while True:
        print("\n" + "="*50)
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
        print("7. Explain last AI response")
        print("8. Exit")
        choice = input("\nEnter choice (1-8): ").strip()

        if choice == "1":
            user_input = input("User input: ")
            context = "\n".join([f"{msg['sender']}: {msg['text']}" for msg in chat_history[-4:]]) if chat_history else ""
            print("\n--- Conversational Response ---")
            conv_response = tutor.get_conversational_response(user_input, context)
            print(f"AI: {conv_response}")
            chat_history.append({"sender": "User", "text": user_input})
            chat_history.append({"sender": "AI", "text": conv_response})
            last_ai_response = conv_response
            last_user_input = user_input
        elif choice == "2":
            last_user = next((msg for msg in reversed(chat_history) if msg["sender"] == "User"), None)
            if not last_user:
                print("No user input found in chat history.")
                continue
            context = "\n".join([f"{msg['sender']}: {msg['text']}" for msg in chat_history[-4:]])
            print("\n--- Feedback (on last user input) ---")
            feedback = tutor.get_detailed_feedback(last_user["text"], context)
            print(feedback)
        elif choice == "3":
            context = "\n".join([f"{msg['sender']}: {msg['text']}" for msg in chat_history[-4:]]) if chat_history else "No previous conversation"
            print("\n--- Suggestions (based on recent context) ---")
            suggestions = tutor.get_suggestions(context)
            for i, suggestion in enumerate(suggestions, 1):
                if 'romanized' in suggestion:
                    print(f"{i}. {suggestion['text']} - {suggestion['romanized']} - {suggestion['translation']}")
                else:
                    print(f"{i}. {suggestion['text']} - {suggestion['translation']}")
        elif choice == "4":
            last_user = next((msg for msg in reversed(chat_history) if msg["sender"] == "User"), None)
            last_ai_idx = next((i for i in range(len(chat_history)-1, -1, -1) if chat_history[i]["sender"] == "AI"), None)
            last_ai = chat_history[last_ai_idx] if last_ai_idx is not None else None
            if not last_user or not last_ai:
                print("Not enough conversation history for checker (need both user and AI messages).")
                continue
            context = "\n".join([f"{msg['sender']}: {msg['text']}" for msg in chat_history[-4:]])
            print("\n--- Original Conversational Response ---")
            print(f"AI: {last_ai['text']}")
            print("\n--- Checker Response ---")
            checked_response = tutor.check_simple(last_user["text"], last_ai["text"])
            print(f"Checked: {checked_response}")
            # Replace the last AI response in chat_history with the checked response
            if last_ai_idx is not None:
                chat_history[last_ai_idx]["text"] = checked_response
            last_ai_response = checked_response
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
            if not last_ai_response:
                print("No AI response to explain yet. Run a conversation first.")
                continue
            context = "\n".join([f"{msg['sender']}: {msg['text']}" for msg in chat_history[-4:]]) if chat_history else ""
            explanation = tutor.explain_llm_response(last_ai_response, last_user_input or "", context)
            print(f"Explanation: {explanation}")
        elif choice == "8":
            print("Goodbye!")
            break
        else:
            print("Invalid choice. Please enter 1-8.")

if __name__ == "__main__":
    main() 