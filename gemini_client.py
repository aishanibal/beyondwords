import json
import os
from datetime import datetime
from typing import Optional, Dict, List
import re

# Try to import Google AI, but make it optional
try:
    import google.generativeai as genai
    GOOGLE_AI_AVAILABLE = True
except ImportError:
    GOOGLE_AI_AVAILABLE = False
    print("⚠️ Google AI not available. Install with: pip install google-generativeai")

# Configure Google AI if available and API key is set
api_key = os.getenv("GOOGLE_API_KEY")
if GOOGLE_AI_AVAILABLE and api_key:
    try:
        genai.configure(api_key=api_key)
        print("✅ Google AI configured successfully")
    except Exception as e:
        print(f"⚠️ Error configuring Google AI: {e}")
        GOOGLE_AI_AVAILABLE = False
elif not api_key:
    print("⚠️ GOOGLE_API_KEY environment variable not set.")
    print("Try setting it with: export GOOGLE_API_KEY='your-api-key-here'")
    print("Or run: source ~/.bashrc or source ~/.zshrc if you set it there")
    GOOGLE_AI_AVAILABLE = False

class FilipinoHeritageTutor:
    def __init__(self, model_name="gemini-1.5-flash", feedback_language="English", log_file="conversation_log.json"):
        if GOOGLE_AI_AVAILABLE:
            try:
                self.model = genai.GenerativeModel(model_name)
            except Exception as e:
                print(f"⚠️ Error creating model: {e}")
                self.model = None
        else:
            self.model = None
        self.feedback_language = feedback_language
        self.log_file = log_file
        self.conversation_id = datetime.now().strftime("%Y%m%d_%H%M%S")

    def log_response(self, user_input: str, tutor_response: str, context: str = "", turn_number: int = 1):
        log_entry = {
            "conversation_id": self.conversation_id,
            "timestamp": datetime.now().isoformat(),
            "turn_number": turn_number,
            "user_input": user_input,
            "tutor_response": tutor_response,
            "context": context,
            "model_used": "gemini-1.5-flash",
            "feedback_language": self.feedback_language
        }
        try:
            with open(self.log_file, 'r', encoding='utf-8') as f:
                logs = json.load(f)
        except (FileNotFoundError, json.JSONDecodeError):
            logs = {"conversations": []}
        logs["conversations"].append(log_entry)
        with open(self.log_file, 'w', encoding='utf-8') as f:
            json.dump(logs, f, indent=2, ensure_ascii=False)
        print(f"📝 Logged turn {turn_number} to {self.log_file}")

    def create_system_prompt(self) -> str:
        return f"""Conversational Tagalog Tutor for Heritage Learners
You are a warm, culturally-aware AI language tutor designed specifically for heritage speakers who are relearning their Filipino heritage language, especially Tagalog.

IMPORTANT CULTURAL GUIDANCE (READ CAREFULLY):
- Use 'Hay naku' only in rare cases of strong exasperation or frustration. Do NOT use 'Hay naku' for boredom, mild surprise, or casual empathy. If you are unsure, do NOT use 'Hay naku'.
- Do NOT reference a long-standing relationship, previous conversations, or say things like \"Matagal na rin tayong hindi nag-uusap\" unless the user has brought it up first.
- Match the length and detail of your response to the user's input. If the user gives a short or simple message, respond in a similarly concise and natural way.
- Avoid giving long, multi-sentence stories or explanations unless the user does so first.

Your job is to:
Engage users in conversation that flows naturally and feels emotionally attuned, using phrasing and turns that sound like a real, friendly Filipino speaker.
Gently correct grammar and sentence structure.
Help users build confidence expressing themselves with cultural and emotional authenticity.
Support common challenges like code-switching, emotional phrasing, and politeness strategies.
CRITICAL: Your own Tagalog responses must be grammatically correct and natural. You are teaching the language, so you cannot make mistakes in your responses.

CONVERSATION FLOW RULES:
- Always respond to questions before asking your own.
- Follow natural Filipino conversation patterns, not English-style turns.
- For yes/no questions like 'Gusto mo ba...?' or 'Nais mo ba...?', respond with an answer first before asking your follow-up.
- You can extend conversations not just by asking questions, but also by sharing relatable experiences, comments, or stories, and encouraging the user to share their own thoughts or feelings.
- Do not offer things you cannot actually give virtually (like food or drinks).

RESPONSE STRUCTURE FOR EVERY TURN:
- Main Response (in Filipino): Use appropriate vocabulary for heritage speakers (basic/intermediate fluency). Full sentences only. Use Tagalog by default, unless another Filipino language is requested. Match the tone and context of the conversation. Use correct verb tenses (past: kumain, present: kumakain, future: kakain). Avoid unnecessary code-switching unless contextually or culturally appropriate.
- Error Feedback (in {self.feedback_language}): Identify and explain any mistakes the user made. Incorrect grammar (e.g., verb tense, focus, aspect), incorrect or unnatural vocabulary, incorrect sentence structure. If the user uses an English or other non-Tagalog word that has a more natural or common Tagalog equivalent (e.g., 'friend' instead of 'kaibigan'), gently suggest: \"Instead of using 'friend', you can sound more fluent if you use 'kaibigan' instead.\"
- Explanation of Your Response (in {self.feedback_language}): Break down what you said in {self.feedback_language}. For each key phrase: show the original phrase, provide the English translation, briefly explain parts of speech or meaning (e.g., interjection, verb, subject). Keep it clear, simple, and useful for learners.
- Suggested Replies (in Filipino with {self.feedback_language} translation): Provide three possible follow-up replies that the user could say. Should match the flow and context of the conversation. Include both simple and slightly more challenging phrases.

ADDITIONAL BEHAVIOR INSTRUCTIONS:
- Use Tagalog by default unless another Filipino language is requested.
- If the user selects another Filipino language (e.g., Cebuano, Waray, Kapampangan), use it consistently.
- Speak like a friendly older sibling or patient tutor—warm, relaxed, and encouraging.
- Avoid robotic tone; make it feel like a real person helping them learn.

QUALITY CONTROL FOR YOUR RESPONSES:
- Before replying, double-check that your Tagalog is grammatically correct and natural, appropriate for the cultural and conversational context, and free from English-influenced sentence structures.

Sample Output Format
Main Response (Tagalog):
Okay lang ako! Ikaw, kumusta ka?
Error Feedback ({self.feedback_language}):
You said: \"Nakita ko sila kahapon sa mall at kain kami sa Jollibee.\"
Correction: \"kumain kami sa Jollibee\"
Explanation: You used the root verb \"kain\" instead of the past tense \"kumain\", which is needed to match the past tense of \"nakita ko sila kahapon\".
Explanation of AI's Response ({self.feedback_language}):
Okay lang ako! - I'm okay!
Ikaw, kumusta ka? – You, how are you?
Suggested Replies:
Mabuti rin ako, salamat sa pagtanong! – I'm fine too, thank you for asking!
Medyo pagod ako ngayon. – I'm a bit tired today.
Masaya ako kasi weekend na! – I'm happy because it's the weekend!
"""

    def get_relevant_grammar_rules(self, user_input: str) -> str:
        grammar_rules = {
            "dahil": """
GRAMMAR RULE - "dahil" (because) clauses:
- Use descriptive form: "dahil maganda ang panahon" (because the weather is nice)
- NOT noun phrase form: "dahil magandang panahon" (incorrect)
- Pattern: "dahil + adjective + ang + noun"
""",
            "kumusta": """
GRAMMAR RULE - "Kumusta ka?" responses:
- Answer first: "Okay lang ako."
- Then ask back: "Ikaw?" or "Ikaw, kumusta ka?"
- NEVER ask back first: "Kumusta ka rin?" (unnatural)
""",
            "questions": """
GRAMMAR RULE - Responding to questions:
- When asked "Nais mo ba sumali sa akin?" (Do you want to join me?)
- Answer first: "Oo, gusto ko!" or "Hindi, salamat"
- NEVER ask back first without answering
- Pattern: Answer → Then ask back if appropriate
""",
            "default": """
BASIC GRAMMAR REFERENCE:
- Use "adjective + ang + noun" for descriptive statements
- Use "adjective + ng/na + noun" for noun phrases
- In "dahil" clauses, use descriptive form
- Answer greetings before asking back
- Answer questions first before asking back
- When using words like 'din/daw/dito', if the word before ends in a vowel, change:
    - 'din' to 'rin' (e.g., 'hello din' → 'hello rin')
    - 'daw' to 'raw' (e.g., 'sabi daw' → 'sabi raw')
    - 'dito' to 'rito' (e.g., 'punta ka dito' → 'punta ka rito')
  This makes the sentence sound more natural in Tagalog.
"""
        }
        relevant_rules = []
        if "dahil" in user_input.lower():
            relevant_rules.append(grammar_rules["dahil"])
        if "kumusta" in user_input.lower():
            relevant_rules.append(grammar_rules["kumusta"])
        if any(q in user_input.lower() for q in ["nais mo ba", "gusto mo ba", "pwede ba", "okay ba"]):
            relevant_rules.append(grammar_rules["questions"])
        relevant_rules.append(grammar_rules["default"])
        return "\n".join(relevant_rules)

    def get_relevant_cultural_guidance(self, user_input: str) -> str:
        notes = []
        # Example: warn about 'Hay' as a greeting
        notes.append('- Use varied Filipino expressions instead of overusing "Hay naku". Natural options include: "ahh", "ay", "hala", "oo nga", "hindi naman", "ah ganon ba", "naku", "ay naku", "hala naman", "oo naman", "ay oo", "hindi kaya", "ay hindi", "ah talaga", "ay ganon", "hala sige", "oo sige", etc. Choose contextually appropriate expressions.')
        # Add more checks as needed
        notes.append('- Use "po/opo" for politeness with elders or in formal situations.')
        notes.append('- "Kamusta" is more natural than "kumusta" in casual speech.')
        notes.append('- "Magandang araw" is formal; "Hi" or "Hello" is common among youth.')
        notes.append('- Avoid direct refusals; use polite, indirect language when declining.')
        notes.append('- Do NOT use "Hay naku" for boredom, mild surprise, or casual empathy. "Hay naku" is only for strong exasperation, frustration, or when something is truly troublesome.')
        notes.append('- For boredom or mild surprise, use "Ah, ganon ba?", "Ay, ganon pala?", "Naku, bored ka pala?", or "Ay, ganon?".')
        notes.append('- Example (Incorrect): "Hay naku, bored ka?" (unnatural)')
        notes.append('- Example (Correct): "Ah, ganon ba? Anong ginagawa mo?" or "Ay, ganon pala? Gusto mo magkwentuhan?"')
        return "CULTURAL GUIDANCE:\n" + "\n".join(notes)

    def get_empty_input_response(self) -> str:
        """Return a robust, maintainable response for empty user input."""
        return (
            "Main Response (Tagalog):\nAno yun? Di kita narinig nang maayos.\n\n"
            "Error Feedback (English):\nYou didn't say anything. Please try again.\n\n"
            "Explanation of AI's Response (English):\n'Ano yun?' means 'What was that?' and 'Di kita narinig nang maayos.' means 'I didn't hear you clearly.'\n\n"
            "Suggested Replies (Filipino + English):\nUlitin ko po. – (I will repeat.)\nPasensya na, mahina ang signal. – (Sorry, the signal is weak.)\nNarinig mo ba ako? – (Did you hear me?)\n"
        )

    def format_context(self, user_input: str, tutor_response: str, context: str) -> str:
        """Append the latest user and tutor turn to the conversation context."""
        return f"{context}User: {user_input}\nTutor: {tutor_response}\n"

    def get_grammar_rule_section(self, user_input: str) -> str:
        """Return grammar rules relevant to the user input."""
        return self.get_relevant_grammar_rules(user_input)

    def get_cultural_guidance_section(self, user_input: str) -> str:
        """Return cultural guidance relevant to the user input."""
        return self.get_relevant_cultural_guidance(user_input)

    def build_prompt(self, user_input: str, context: str) -> str:
        """Assemble the full prompt for the LLM, including system, grammar, and cultural guidance."""
        system_prompt = self.create_system_prompt()
        grammar_ref = self.get_grammar_rule_section(user_input)
        cultural_guidance = self.get_cultural_guidance_section(user_input)
        return (
            f"{system_prompt}\n\n"
            f"{grammar_ref}\n\n"
            f"{cultural_guidance}\n\n"
            f"**CURRENT USER INPUT:** \"{user_input}\"\n"
            f"**PREVIOUS CONVERSATION:** {context if context else 'Starting a new conversation'}\n\n"
            "IMPORTANT: The user input above is the CURRENT input you should respond to. Ignore any user inputs in the previous conversation context.\n\n"
            "Please provide your response following the exact 4-section format specified above."
        )

    def provide_conversational_response(self, user_input: str, context: str = "", llm_callback=None) -> str:
        """Generate a conversational response, handling empty input and using the LLM for valid input."""
        if not user_input or not user_input.strip():
            return self.get_empty_input_response()
        
        prompt = self.build_prompt(user_input, context)
        
        if llm_callback:
            try:
                response = llm_callback(prompt)
                return response
            except Exception as e:
                return f"Error in generating response: {str(e)}"
        elif self.model and GOOGLE_AI_AVAILABLE:
            try:
                print(f"🤖 Sending request to Gemini... (input length: {len(user_input)} chars)")
                response = self.model.generate_content(prompt)
                if response and response.text:
                    return response.text
                else:
                    return "Error: No response received from Gemini"
            except Exception as e:
                error_msg = f"Error in generating response: {str(e)}"
                print(f"❌ {error_msg}")
                if "500" in str(e):
                    return f"{error_msg}\n\nThis might be due to:\n- API rate limiting (try again in a few minutes)\n- Temporary Google AI service issues\n- Invalid or expired API key"
                return error_msg
        else:
            return f"⚠️ Google AI not available. Set GOOGLE_API_KEY environment variable."

   
    def test_api_connection(self) -> bool:
        """Test if the Google AI API is working properly."""
        if not self.model or not GOOGLE_AI_AVAILABLE:
            print("❌ Google AI not available or model not initialized")
            return False
        
        try:
            print("🧪 Testing Google AI connection...")
            test_response = self.model.generate_content("Hello, this is a test.")
            if test_response and test_response.text:
                print("✅ Google AI connection successful!")
                return True
            else:
                print("❌ No response received from Google AI")
                return False
        except Exception as e:
            print(f"❌ Google AI connection failed: {str(e)}")
            return False

def extract_main_response(llm_output: str) -> str:
    """Extract the Main Response (Tagalog) section from the LLM output."""
    match = re.search(r'Main Response \(Tagalog\):\s*(.*?)(?:\n\n|$)', llm_output, re.DOTALL)
    if match:
        return match.group(1).strip()
    return llm_output.strip()[:200]  # fallback

# Singleton instance for efficiency
_filipino_tutor_instance = None

def get_conversational_response(transcription: str, chat_history: List[Dict], language: str = 'en', user_level: str = 'beginner', user_topics: List[str] = None) -> str:
    """Get conversational response for main chat. Uses FilipinoHeritageTutor for Tagalog/Filipino."""
    global _filipino_tutor_instance
    
    # Handle default user_topics
    if user_topics is None:
        user_topics = []
    
    if language == 'tl':  # Tagalog/Filipino
        if _filipino_tutor_instance is None:
            _filipino_tutor_instance = FilipinoHeritageTutor()
        # Build context from last 4 messages
        context = "\n".join([f"{msg['sender']}: {msg['text']}" for msg in chat_history[-4:]]) if chat_history else ""
        return _filipino_tutor_instance.provide_conversational_response(transcription, context)
    else:
        # For other languages, use Gemini directly with similar structure to Ollama
        if not GOOGLE_AI_AVAILABLE:
            return "[Gemini: Google AI not available. Please set GOOGLE_API_KEY environment variable.]"
        
        try:
            # Create a temporary model instance for non-Filipino languages
            model = genai.GenerativeModel("gemini-1.5-flash")
            
            # Format chat history for context (last 4 messages)
            chat_context = ""
            if chat_history:
                recent_messages = chat_history[-4:]
                chat_context = "\n".join([f"{msg['sender']}: {msg['text']}" for msg in recent_messages])
            
            # Language-specific instructions
            language_instruction = ""
            if language == 'es':
                language_instruction = "Respond ONLY in Spanish. Do NOT provide any English translation or explanation."
            elif language == 'hi':
                language_instruction = "Respond ONLY in Hindi. Do NOT provide any English translation or explanation."
            elif language == 'ja':
                language_instruction = "Respond ONLY in Japanese. Do NOT provide any English translation or explanation."
            
            # User context for personalization
            level_context = ""
            if user_level == 'heritage':
                level_context = "You're talking to a heritage speaker who understands the language but needs confidence speaking."
            elif user_level == 'beginner':
                level_context = "You're talking to a beginner learner. Be encouraging and use simpler vocabulary."
            elif user_level == 'intermediate':
                level_context = "You're talking to an intermediate learner. You can use more complex structures."
            elif user_level == 'advanced':
                level_context = "You're talking to an advanced learner. Feel free to use complex vocabulary and idioms."
            
            topics_context = ""
            if user_topics:
                topics_context = f"Their preferred topics to discuss include: {', '.join(user_topics)}. Try to steer conversation toward these topics when appropriate."
            
            prompt = f"""You are a helpful speech coach having a conversation. 

{level_context}
{topics_context}

Previous conversation:
{chat_context}

The user just said: "{transcription}"

{language_instruction}

Respond naturally as if you're having a conversation. Keep it friendly and encouraging, around 15-25 words. Don't be too formal - just chat naturally! Try to keep the conversation going while considering their experience level and preferred topics."""
            
            response = model.generate_content(prompt)
            if response and response.text:
                return response.text
            else:
                return "Thanks for your speech! Keep practicing."
                
        except Exception as e:
            print(f"Gemini conversational response error: {e}")
            return "Thanks for your speech! Keep practicing."

def get_detailed_feedback(phoneme_analysis: str, reference_text: str, recognized_text: str, chat_history: List[Dict], language: str = 'en', user_level: str = 'beginner', user_topics: List[str] = None) -> str:
    # For now, use the FilipinoHeritageTutor for Tagalog/Filipino, fallback for others
    global _filipino_tutor_instance
    if language == 'tl':
        if _filipino_tutor_instance is None:
            _filipino_tutor_instance = FilipinoHeritageTutor()
        # Use recognized_text as the main input, context from chat_history
        context = "\n".join([f"{msg['sender']}: {msg['text']}" for msg in chat_history[-4:]]) if chat_history else ""
        # For now, just return a conversational response as feedback
        return _filipino_tutor_instance.provide_conversational_response(recognized_text, context)
    else:
        # Fallback: return a simple message
        return "[Gemini: Only Tagalog/Filipino ('tl') is supported for detailed feedback in this version.]"

def get_text_suggestions(chat_history: List[Dict], language: str = 'en', user_level: str = 'beginner', user_topics: List[str] = None) -> list:
    # For now, use FilipinoHeritageTutor for Tagalog/Filipino, fallback for others
    global _filipino_tutor_instance
    if language == 'tl':
        if _filipino_tutor_instance is None:
            _filipino_tutor_instance = FilipinoHeritageTutor()
        context = "\n".join([f"{msg['sender']}: {msg['text']}" for msg in chat_history[-4:]]) if chat_history else ""
        # Use the last tutor response as the main response
        last_tutor_response = chat_history[-1]['text'] if chat_history and chat_history[-1]['sender'] == 'Tutor' else ''
        suggestions = _filipino_tutor_instance.get_suggested_replies(last_tutor_response, context)
        # Try to parse suggestions into a list
        if isinstance(suggestions, str):
            # Split by lines and filter
            return [line.strip() for line in suggestions.split('\n') if line.strip()]
        return suggestions
    else:
        return ["[Gemini: Only Tagalog/Filipino ('tl') is supported for suggestions in this version.]"]

def get_translation(text: str, source_language: str = 'auto', target_language: str = 'en', breakdown: bool = False) -> dict:
    # For now, just return a stub
    return {"translation": "[Gemini: Translation not implemented in this version.]"}

def is_gemini_ready() -> bool:
    # Check Gemini API connection
    global _filipino_tutor_instance
    if _filipino_tutor_instance is None:
        _filipino_tutor_instance = FilipinoHeritageTutor()
    return _filipino_tutor_instance.test_api_connection()

def interactive_terminal_test():
    tutor = FilipinoHeritageTutor()
    print("\n=== Filipino Heritage Tutor Interactive Test ===\nType 'quit' or 'exit' to stop early.\n")
    
    # Test API connection first
    if not tutor.test_api_connection():
        print("⚠️ API test failed. Please check your GOOGLE_API_KEY and try again.")
        return
    
    context = ""
    for turn in range(1, 11):
        user_input = input(f"\nTurn {turn} - You: ")
        if user_input.strip().lower() in {"quit", "exit"}:
            print("Exiting conversation.")
            break
        response = tutor.provide_conversational_response(user_input, context)
        print(f"\nTutor: {response}\n")
        # Extract only the main response for context
        main_response = extract_main_response(response)
        context += f"User: {user_input}\nTutor: {main_response}\n"

if __name__ == "__main__":
    interactive_terminal_test() 