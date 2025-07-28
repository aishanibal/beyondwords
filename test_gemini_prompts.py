import sys
from gemini_client import (
    create_tutor,
    is_gemini_ready,
    TagalogHeritageTutor, 
    generate_conversation_summary
)

def main():
    print("=== Gemini Language Tutor Test Interface ===")
    
    # Language selection
    print("\nAvailable languages:")
    print("1. Tagalog (tl)")
    print("2. Japanese (ja)")
    print("3. Korean (ko)")
    print("4. Mandarin Chinese (zh)")
    print("5. Hindi (hi)")
    print("6. Tamil (ta)")
    print("7. Malayalam (ml)")
    print("8. Odia (or)")
    print("9. Spanish (es)")
    print("10. French (fr)")
    
    lang_choice = input("Select language (1-10): ").strip()
    language_map = {
        "1": "tl", "2": "ja", "3": "ko", "4": "zh", "5": "hi",
        "6": "ta", "7": "ml", "8": "or", "9": "es", "10": "fr"
    }
    
    language = language_map.get(lang_choice, "tl")
    print(f"Selected language: {language}")
    
    # Create tutor
    from gemini_client import create_tutor
    tutor = create_tutor(language)
    
    # Set user preferences
    tutor.user_level = input("Enter proficiency level (beginner/elementary/intermediate/advanced/fluent): ").strip() or "intermediate"
    tutor.user_closeness = input("Enter closeness level (intimate/friendly/respectful/formal/distant): ").strip() or "friendly"
    topics_input = input("Enter preferred topics (comma-separated, or press Enter for none): ").strip()
    tutor.user_topics = [topic.strip() for topic in topics_input.split(",")] if topics_input else []
    
    print(f"\nTutor configured:")
    print(f"Language: {tutor.language_name}")
    print(f"Level: {tutor.user_level}")
    print(f"Closeness: {tutor.user_closeness}")
    print(f"Topics: {tutor.user_topics}")
    
    chat_history = []
    last_ai_response = ""
    last_user_input = ""
    
    while True:
        try:
            print("\n" + "="*50)
            print("1. Conversational Response")
            print("2. Feedback (on last user input)")
            print("3. Suggestions (based on recent context)")
            print("4. Checker (on last exchange)")
            print("5. Show Chat History")
            print("6. Clear Chat History")
            print("7. Explain last AI response")
            print("8. Exit")
            print("9. Generate Conversation Summary")
            choice = input("\nEnter choice (1-9): ").strip()

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
                    if suggestion.get('explanation'):
                        print(f"   Explanation: {suggestion['explanation']}")
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
            elif choice == "9":
                if not chat_history:
                    print("No conversation history yet.")
                else:
                    print("\n--- Conversation Performance Summary ---")
                    perf = tutor.generate_conversation_performance_summary(chat_history)
                    print(f"Title: {perf['title']}")
                    print(f"Description: {perf['description']}")
                    print(f"Mistakes per 100 words: {perf['mistakes_per_100_words']}")
                    print("Mistake Log:")
                    for entry in perf['mistake_log']:
                        print(f"  - {entry}")
                    print("Performance Tags:")
                    for tag, value in perf['performance_tags'].items():
                        print(f"  {tag}: {value}")
                    print(f"Summary: {perf['summary']}")
            else:
                print("Invalid choice. Please enter 1-9.")
        except Exception as e:
            print(f"\n❌ An error occurred: {str(e)}")
            print("Please try again with a different choice.")
            continue

if __name__ == "__main__":
    main() 