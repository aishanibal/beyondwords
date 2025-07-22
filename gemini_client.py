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

# Base class for language tutors
class LanguageTutor:
    def __init__(self, language_code: str, language_name: str, model_name="gemini-1.5-flash", feedback_language="English", log_file="conversation_log.json"):
        self.language_code = language_code
        self.language_name = language_name
        self.feedback_language = feedback_language
        self.log_file = log_file
        self.conversation_id = datetime.now().strftime("%Y%m%d_%H%M%S")
        self.user_level = "beginner"
        self.user_topics = []
        
        if GOOGLE_AI_AVAILABLE:
            try:
                self.model = genai.GenerativeModel(model_name)
            except Exception as e:
                print(f"⚠️ Error creating model: {e}")
                self.model = None
        else:
            self.model = None

    def get_conversational_response(self, user_input: str, context: str = "") -> str:
        """Generate a conversational response in the target language."""
        
        topics_guidance = ""
        topic_integration_rules = ""
        
        if hasattr(self, 'user_topics') and self.user_topics and len(self.user_topics) > 0:
            topics_list = ', '.join(self.user_topics)
            topics_guidance = f"\n\nUSER'S PREFERRED TOPICS: {topics_list}"
            
            topic_integration_rules = f"""
    TOPIC INTEGRATION:
    - Connect your response to the user's preferred topics ({topics_list}).
    - Show enthusiasm and expand when a topic is mentioned.
    - Gently steer the conversation toward these topics if it becomes generic.
    - Ask questions that encourage the user to practice vocabulary related to these topics."""

        prompt = f"""Conversational Heritage Language Tutor  
    You are a warm, culturally-aware AI tutor for a {self.user_level} heritage learner of {self.language_name}.

    Your job is to engage users in natural, emotionally rich conversation that sounds like a real {self.language_name} speaker.

    Follow natural conversation patterns:  
    - Respond fully to the user's input before asking your own question.  
    - Share relatable experiences, comments, or stories to deepen connection but do not monopolize the conversation.
    - Use vocabulary appropriate for a {self.user_level} {self.language_name} speaker.  
    – If shifting to a preferred topic, use a light, natural bridge that relates to the user's current mood or situation. Do not abruptly bring up the topic.
    - Your response should be concise: no longer than 10-25 words.

    {self._get_cultural_rules()}

    {topics_guidance}
    {topic_integration_rules}

    Current conversation context:  
    {context}

    User just said: "{user_input}"

    Reply naturally in {self.language_name}."""
        
        try:
            response = self.model.generate_content(prompt)
            if response and response.text:
                return response.text.strip()
            else:
                return "I'm here to help you practice!"
        except Exception as e:
            print(f"Error generating conversational response: {e}")
            return "Let's keep practicing together!"

    def get_detailed_feedback(self, user_input: str, context: str = "") -> str:
        """Generate detailed feedback about grammar, pronunciation, etc."""
        if not self.model or not GOOGLE_AI_AVAILABLE:
            return "⚠️ Google AI not available for feedback."
        
        grammar_rules = self._get_grammar_rules(user_input)
        
        prompt = f"""
      
You are a kind, culturally-aware language tutor helping a heritage speaker improve their {self.language_name}.

Your job is to identify and gently explain any grammar or phrasing mistakes in the user's message. Focus on helping them sound natural and fluent, like a native speaker.

USER INPUT:
"{user_input}"

{grammar_rules}

YOUR RESPONSE STRUCTURE (use {self.feedback_language} for explanations):

- If the input is correct and natural, simply say:
"Correct, that sounds great!" or something similar with the same sentiment and length

- If there are errors, follow this format:
  You said: "..."
  Correction: "..."
Explanation: Briefly explain why it was incorrect (e.g., verb tense, word order, unnatural phrasing, incorrect particle, politeness marker, etc.).

TIPS:
- Be encouraging and specific.
- Focus on grammar, natural sentence structure, and phrasing that sounds native.
- If the user used a non-{self.language_name} word that has a better equivalent, suggest a replacement like: "Instead of saying 'X', you'll sound more fluent if you say 'Y'."

Speak like a friendly older sibling or patient tutor. Keep your tone warm, supportive, and helpful.
"""
        
        try:
            response = self.model.generate_content(prompt)
            if response and response.text:
                return response.text.strip()
            else:
                return "No corrections needed - great job!"
        except Exception as e:
            print(f"Error generating feedback: {e}")
            return "Keep practicing - you're doing well!"

    def get_suggestions(self, context: str = "") -> list:
        """Generate suggestions for what the user could say next."""
        if not self.model or not GOOGLE_AI_AVAILABLE:
            return [{"text": "Keep practicing!", "translation": "Continue learning!"}]
        
        # Get level guidance directly
        level_guidance = ""
        if self.user_level == 'beginner':
            level_guidance = "User is a beginner learner. Use very simple vocabulary and basic sentence structures."
        elif self.user_level == 'elementary':
            level_guidance = "User is an elementary learner. Use simple vocabulary and short, clear sentences."
        elif self.user_level == 'intermediate':
            level_guidance = "User is an intermediate learner. Use moderately complex structures and vocabulary."
        elif self.user_level == 'advanced':
            level_guidance = "User is an advanced learner. Use complex vocabulary and idiomatic expressions."
        elif self.user_level == 'fluent':
            level_guidance = "User is fluent. Use natural, native-level expressions and advanced vocabulary."
        
        # Get topics guidance directly
        topics_guidance = ""
        if self.user_topics and len(self.user_topics) > 0:
            topics_list = ', '.join(self.user_topics)
            topics_guidance = f"CRITICAL: User specifically wants to practice discussing: {topics_list}. ALWAYS try to connect conversations and suggestions to these topics. Make this a priority in your responses."
        
        topic_focus = ""
        if hasattr(self, 'user_topics') and self.user_topics and len(self.user_topics) > 0:
            topics_list = ', '.join(self.user_topics)
            topic_focus = f"""
CRITICAL TOPIC REQUIREMENTS:
- Connect the user's reply to their preferred topics: {topics_list}
- If any topic has already been mentioned, expand on it with interest or a follow-up question
- If the current conversation feels generic, gently steer toward one of the user's topics
- Example (topic: 'food'): Suggest replies about favorite dishes, meals, or asking what the other person likes to eat
"""

        prompt = f"""
You are a culturally-aware AI tutor helping a heritage speaker of {self.language_name} continue a natural conversation. Your goal is to generate fluent, emotionally attuned, and topic-relevant replies that help the learner stay engaged and build confidence using the language.

YOUR TASK:  
The user may not know how to respond to the AI's last message. Suggest 3 natural replies they could use to continue the conversation.  
Each should directly respond to the AI's most recent message, while sounding realistic, culturally appropriate, and friendly.  
Help the user stay engaged and gently steer the conversation toward their favorite topics.

Below is the conversation so far:
{context}

USER INFO:
- Proficiency level: {self.user_level}
- {topics_guidance}

{topic_focus}
IMPORTANT:
– Use vocabulary and sentence structure appropriate for a {self.user_level} learner.  
– Each suggestion should be around the same number of words as the user's message (or up to 1.5× longer).  

Use this exact format:
[Simple {self.language_name} phrase] - [{self.feedback_language} translation]
[Slightly more complex {self.language_name}] - [{self.feedback_language} translation]
[Another natural option] - [{self.feedback_language} translation]

– Do NOT use brackets or placeholders. Always use real, specific examples that a native speaker would mention.
-  Never output [Artist's Name], [Song Title], [Genre], or anything in brackets.
"""
        
        try:
            response = self.model.generate_content(prompt)
            if response and response.text:
                return self._parse_suggestions(response.text)
            else:
                return self._get_fallback_suggestions()
        except Exception as e:
            print(f"Error generating suggestions: {e}")
            return self._get_fallback_suggestions()





    def _parse_suggestions(self, response_text: str) -> list:
        """Parse suggestions response into list format."""
        suggestions = []
        lines = response_text.split('\n')
        
        for line in lines:
            line = line.strip()
            if ' - ' in line:
                clean_line = line.strip('•-1234567890. ')
                parts = clean_line.split(' - ', 1)
                if len(parts) == 2:
                    text = parts[0].strip('[]')
                    translation = parts[1].strip('[]')
                    if text and translation:
                        suggestions.append({"text": text, "translation": translation})
                        if len(suggestions) >= 3:
                            break
        
        return suggestions if suggestions else self._get_fallback_suggestions()

    def _get_fallback_suggestions(self) -> list:
        """Get fallback suggestions when AI generation fails."""
        return [
            {"text": "Thank you!", "translation": "Thank you!"},
            {"text": "I understand.", "translation": "I understand."},
            {"text": "Can you tell me more?", "translation": "Can you tell me more?"}
        ]

    def _get_grammar_rules(self, user_input: str) -> str:
        """Get language-specific grammar rules. To be implemented by subclasses."""
        return ""

    def _get_cultural_rules(self) -> str:
        """Get language-specific cultural rules. To be implemented by subclasses."""
        return ""

    def check_and_fix_response(self, user_input: str, main_response: str) -> str:
        """Check and fix the tutor's response for grammar and naturalness."""
        if not self.model or not GOOGLE_AI_AVAILABLE:
            return main_response
        
        checker_prompt = f"""You are a native-level {self.language_name} speaker and cultural insider reviewing a language tutor's response to a learner.

Your goal is to make sure the tutor's reply sounds natural, fluent, and culturally appropriate in everyday {self.language_name} conversation. The learner's original message and the tutor's response are shown below:

USER INPUT: "{user_input}"  
TUTOR RESPONSE: "{main_response}"

Revise the tutor's response if needed to:
– Correct grammar errors, including verb usage, sentence structure, and misplaced modifiers  
– Improve fluency to sound like natural, relaxed spoken {self.language_name}  

{self._get_grammar_rules(user_input)}

{self._get_cultural_rules()}

Quality guidelines:
- Do not simplify responses that are already natural, engaging, and successfully guide the conversation with topic-relevant questions.
– Preserve natural personality and tone if the response is expressive or casual  
- Your response should be concise: no longer than 10-25 words.
- If the response is discussing a topic in {self.user_topics}, ensure the corrected response still incorporates it.
- If none of the topics in {self.user_topics} are being discussed, gently steer the conversation toward one of the user's topics.
– Only revise if there's something clearly off (e.g., awkward phrasing, grammatical error, unnatural structure) 
– Think like a real {self.language_name} speaker: would this feel smooth, correct, and relatable in conversation?

If the response is already natural and grammatically accurate, return it unchanged.

Return ONLY the revised {self.language_name} response, with no explanation or formatting."""
        try:
            response = self.model.generate_content(checker_prompt)
            if response and response.text:
                return response.text.strip()
            else:
                return main_response
        except Exception as e:
            print(f"Error in check_and_fix_response: {e}")
            return main_response



# Tagalog-specific tutor with grammar rules and cultural context
class TagalogHeritageTutor(LanguageTutor):
    def __init__(self, model_name="gemini-1.5-flash", feedback_language="English", log_file="conversation_log.json", level="basic/intermediate fluency"):
        super().__init__("tl", "Tagalog", model_name, feedback_language, log_file)
        self.user_level = level
        self.heritage_language = "Tagalog"

    def _get_grammar_rules(self, user_input: str) -> str:
        """Get Tagalog-specific grammar rules for response checking."""
        return """Tagalog grammar rules:
– Use the correct form of discourse particles (e.g., "po", "din/rin", "daw/raw", "ng/nang", "dito/rito") based on context  
    → For example: use "rin" after a word ending in a vowel, and "din" after a consonant  (ex. "hello din" → "hello rin")
Example of unnatural vs. natural phrasing:
- Unnatural: Samahan kita mag-usap.  
- Natural: Usap tayo! / Kwentuhan tayo! / Nandito ako kung gusto mong magkwento."""

    def _get_cultural_rules(self) -> str:
        """Get Tagalog-specific cultural rules for response checking."""
        return f"""Tagalog cultural rules:\n- Avoid overusing \"Hay naku\" — use varied expressions like \"ahh\", \"hala\", \"oo nga\", \"ay naku\", \"ah talaga\", \"ay oo\", etc. Choose based on context."""

    def _get_fallback_suggestions(self) -> list:
        """Get Tagalog-specific fallback suggestions."""
        return [
            {"text": "Salamat sa pagtanong!", "translation": "Thank you for asking!"},
            {"text": "Gusto ko ring malaman yan.", "translation": "I'd like to know that too."},
            {"text": "Pwede mo bang ikwento pa?", "translation": "Can you tell me more?"}
        ]

# Factory function to create language-specific tutors
def create_tutor(language_code: str, user_level: str = 'beginner', user_topics: List[str] = None) -> LanguageTutor:
    """Create appropriate tutor based on language code."""
    if user_topics is None:
        user_topics = []
    
    if language_code == 'tl':  # Tagalog/Filipino
        tutor = TagalogHeritageTutor(level=f"{user_level} fluency")
        tutor.user_level = user_level
        tutor.user_topics = user_topics
        return tutor
    else:
        # Generic tutor for other languages
        tutor = LanguageTutor(language_code, get_language_name(language_code))
        tutor.user_level = user_level
        tutor.user_topics = user_topics
        return tutor

def get_language_name(language_code: str) -> str:
    """Get full language name from code."""
    language_names = {
        'en': 'English',
        'es': 'Spanish', 
        'hi': 'Hindi',
        'ja': 'Japanese',
        'tl': 'Tagalog'
    }
    return language_names.get(language_code, language_code.upper())

# Global tutor instances for efficiency
_tutor_instances = {}

# Main API functions using the modular approach with separate Gemini calls
def get_conversational_response(transcription: str, chat_history: List[Dict], language: str = 'en', user_level: str = 'beginner', user_topics: List[str] = None, formality: str = 'friendly', feedback_language: str = 'en') -> str:
    """Get conversational response using separate Gemini call."""
    if user_topics is None:
        user_topics = []
    if not GOOGLE_AI_AVAILABLE or not api_key:
        return "AI is not available: Gemini API key is not configured."
    
    # Get or create tutor instance
    tutor_key = f"{language}_{user_level}_{','.join(sorted(user_topics))}_{formality}"
    if tutor_key not in _tutor_instances:
        tutor = create_tutor(language, user_level, user_topics)
        tutor.formality = formality
        _tutor_instances[tutor_key] = tutor
    tutor = _tutor_instances[tutor_key]
    
    # Update tutor with current context
    tutor.user_level = user_level
    tutor.user_topics = user_topics
    tutor.formality = formality
    
    # Build context from chat history
    context = "\n".join([f"{msg['sender']}: {msg['text']}" for msg in chat_history[-4:]]) if chat_history else ""
    
    # Add formality and feedback language to the prompt
    formality_note = f"\n\nFORMALITY LEVEL: {formality}\n" if formality else ""
    feedback_lang_note = f"\n\nFEEDBACK LANGUAGE: {feedback_language}\n" if feedback_language else ""
    
    # Make separate Gemini call for conversation
    return tutor.get_conversational_response(transcription, context + formality_note + feedback_lang_note)

def get_detailed_feedback(phoneme_analysis: str, reference_text: str, recognized_text: str, chat_history: List[Dict], language: str = 'en', user_level: str = 'beginner', user_topics: List[str] = None, feedback_language: str = 'en') -> str:
    """Get detailed feedback using separate Gemini call."""
    if user_topics is None:
        user_topics = []
    
    # Get or create tutor instance
    tutor_key = f"{language}_{user_level}_{','.join(sorted(user_topics))}"
    if tutor_key not in _tutor_instances:
        _tutor_instances[tutor_key] = create_tutor(language, user_level, user_topics)
    
    tutor = _tutor_instances[tutor_key]
    
    # Update tutor with current context
    tutor.user_level = user_level
    tutor.user_topics = user_topics
    
    
    # Build context from chat history
    context = "\n".join([f"{msg['sender']}: {msg['text']}" for msg in chat_history[-4:]]) if chat_history else ""
    
    # Add feedback_language to the prompt
    return tutor.get_detailed_feedback(recognized_text, context, feedback_language)

def get_text_suggestions(chat_history: List[Dict], language: str = 'en', user_level: str = 'beginner', user_topics: List[str] = None) -> list:
    """Get text suggestions using separate Gemini call."""
    if user_topics is None:
        user_topics = []
    
    # Get or create tutor instance
    tutor_key = f"{language}_{user_level}_{','.join(sorted(user_topics))}"
    if tutor_key not in _tutor_instances:
        _tutor_instances[tutor_key] = create_tutor(language, user_level, user_topics)
    
    tutor = _tutor_instances[tutor_key]
    
    # Update tutor with current context
    tutor.user_level = user_level
    tutor.user_topics = user_topics
    
    # Build context from chat history
    context = "\n".join([f"{msg['sender']}: {msg['text']}" for msg in chat_history[-4:]]) if chat_history else ""
    
    # Make separate Gemini call for suggestions
    return tutor.get_suggestions(context)

def get_short_feedback(user_input: str, context: str = "", language: str = 'en', user_level: str = 'beginner', user_topics: list = None, feedback_language: str = 'en') -> str:
    """Generate a short, conversational feedback about grammar/style."""
    if not GOOGLE_AI_AVAILABLE:
        return "Short feedback ran (no Gemini API key configured)"
    if user_topics is None:
        user_topics = []
    prompt = (
        f"You are a friendly language tutor. The user just said: \"{user_input}\".\n"
        f"Context: {context}\n"
        f"User level: {user_level}\n"
        f"Preferred topics: {', '.join(user_topics) if user_topics else 'none'}\n"
        f"Give a very short (1-2 sentences) tip or correction about grammar or style, only if needed. "
        f"If there are no issues, say something encouraging. "
        f"Be brief and natural, like a quick chat comment.\n"
        f"Respond in {feedback_language}."
    )
    try:
        model = genai.GenerativeModel("gemini-1.5-flash")
        response = model.generate_content(prompt)
        if response and response.text:
            return response.text.strip()
        else:
            return "Great job!"
    except Exception as e:
        print(f"Short feedback error: {e}")
        return "Keep going!"

def get_translation(text: str, source_language: str = 'auto', target_language: str = 'en', breakdown: bool = False, user_topics: List[str] = None, feedback_language: str = 'en') -> dict:
    """Simple translation function using Gemini."""
    if user_topics is None:
        user_topics = []
    
    if not text or not text.strip():
        return {"translation": "", "breakdown": ""}
    
    if not GOOGLE_AI_AVAILABLE:
        return {"translation": "[Translation unavailable - Google AI not configured]", "breakdown": ""}
    
    try:
        model = genai.GenerativeModel("gemini-1.5-flash")
        
        # Build translation prompt
        if breakdown:
            prompt = f"""Translate the following text and provide a detailed breakdown:\n\nText to translate: \"{text}\"\nSource language: {source_language if source_language != 'auto' else 'detect automatically'}\nTarget language: {target_language}\nFeedback language: {feedback_language}\n\nProvide:\n1. Translation: [Direct translation]\n2. Breakdown: [Word-by-word or phrase-by-phrase explanation of key elements, in {feedback_language}]\n\nFormat your response exactly as:\nTranslation: [your translation here]\nBreakdown: [your breakdown here]"""
        else:
            prompt = f"""Translate the following text accurately:\n\nText: \"{text}\"\nSource language: {source_language if source_language != 'auto' else 'detect automatically'}  \nTarget language: {target_language}\nFeedback language: {feedback_language}\n\nProvide only the translation, no additional explanation. Respond in {feedback_language}."""
        
        response = model.generate_content(prompt)
        
        if response and response.text:
            response_text = response.text.strip()
            
            if breakdown:
                # Parse structured response
                translation = ""
                breakdown_text = ""
                
                lines = response_text.split('\n')
                for line in lines:
                    line = line.strip()
                    if line.startswith('Translation:'):
                        translation = line.replace('Translation:', '').strip()
                    elif line.startswith('Breakdown:'):
                        breakdown_text = line.replace('Breakdown:', '').strip()
                
                # If parsing failed, use the whole response as translation
                if not translation:
                    translation = response_text
                
                return {
                    "translation": translation,
                    "breakdown": breakdown_text
                }
            else:
                return {
                    "translation": response_text,
                    "breakdown": ""
                }
        else:
            return {"translation": "[Translation failed - no response]", "breakdown": ""}
            
    except Exception as e:
        print(f"Translation error: {e}")
        return {"translation": f"[Translation error: {str(e)}]", "breakdown": ""}

def is_gemini_ready() -> bool:
    """Check if Gemini API is available and ready."""
    if not GOOGLE_AI_AVAILABLE:
        return False
    
    try:
        test_tutor = create_tutor('en')
        if test_tutor.model:
            return True
    except Exception as e:
        print(f"Gemini readiness check failed: {e}")
    
    return False