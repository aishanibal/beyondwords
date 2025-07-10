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
        if not self.model or not GOOGLE_AI_AVAILABLE:
            return f"⚠️ Google AI not available. Set GOOGLE_API_KEY environment variable."
        
        prompt = self._build_conversation_prompt(user_input, context)
        
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
        
        prompt = self._build_feedback_prompt(user_input, context)
        
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
        
        prompt = self._build_suggestions_prompt(context)
        
        try:
            response = self.model.generate_content(prompt)
            if response and response.text:
                return self._parse_suggestions(response.text)
            else:
                return self._get_fallback_suggestions()
        except Exception as e:
            print(f"Error generating suggestions: {e}")
            return self._get_fallback_suggestions()

    def _build_conversation_prompt(self, user_input: str, context: str) -> str:
        """Build prompt for conversational response - to be overridden by language-specific classes."""
        level_guidance = self._get_level_guidance()
        topics_guidance = self._get_topics_guidance()
        
        topic_integration = ""
        if self.user_topics and len(self.user_topics) > 0:
            topics_list = ', '.join(self.user_topics)
            topic_integration = f"""
TOPIC FOCUS REQUIREMENTS:
- User wants to practice talking about: {topics_list}
- Connect your response to these topics whenever contextually appropriate
- If conversation is generic, gently steer toward their preferred topics
- Ask questions that encourage vocabulary practice around: {topics_list}"""
        
        return f"""You are a helpful {self.language_name} language tutor having a conversation.

{level_guidance}
{topics_guidance}
{topic_integration}

Previous conversation:
{context}

The user just said: "{user_input}"

Respond naturally in {self.language_name}. Keep it friendly and encouraging, around 15-25 words. Try to keep the conversation going while considering their experience level and interests. PRIORITIZE incorporating their preferred topics when appropriate."""

    def _build_feedback_prompt(self, user_input: str, context: str) -> str:
        """Build prompt for detailed feedback - to be overridden by language-specific classes."""
        return f"""You are a {self.language_name} language expert providing feedback to a learner.

User's proficiency: {self.user_level}
User said: "{user_input}"
Context: {context}

Provide helpful feedback about any grammar, vocabulary, or usage errors in {self.feedback_language}. If there are no errors, say "No corrections needed - great job!" Be encouraging and specific about improvements."""

    def _build_suggestions_prompt(self, context: str) -> str:
        """Build prompt for suggestions - to be overridden by language-specific classes."""
        level_guidance = self._get_level_guidance()
        topics_guidance = self._get_topics_guidance()
        
        return f"""You are a {self.language_name} language tutor.

Context: {context}
{level_guidance}
{topics_guidance}

Provide three possible follow-up replies the user could say in {self.language_name}.
Format as:
[{self.language_name} phrase] - [{self.feedback_language} translation]
[{self.language_name} phrase] - [{self.feedback_language} translation]  
[{self.language_name} phrase] - [{self.feedback_language} translation]

Make them natural and appropriate for their level."""

    def _get_level_guidance(self) -> str:
        """Get guidance text based on user level."""
        if self.user_level == 'heritage':
            return "User is a heritage speaker who understands the language but needs confidence speaking. Use natural, everyday expressions."
        elif self.user_level == 'beginner':
            return "User is a beginner learner. Use simple vocabulary and basic sentence structures."
        elif self.user_level == 'intermediate':
            return "User is an intermediate learner. Use moderately complex structures and vocabulary."
        elif self.user_level == 'advanced':
            return "User is an advanced learner. Use complex vocabulary and idiomatic expressions."
        return ""

    def _get_topics_guidance(self) -> str:
        """Get guidance text based on user topics."""
        if self.user_topics and len(self.user_topics) > 0:
            topics_list = ', '.join(self.user_topics)
            return f"CRITICAL: User specifically wants to practice discussing: {topics_list}. ALWAYS try to connect conversations and suggestions to these topics. Make this a priority in your responses."
        return ""

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

# Tagalog-specific tutor with grammar rules and cultural context
class TagalogHeritageTutor(LanguageTutor):
    def __init__(self, model_name="gemini-1.5-flash", feedback_language="English", log_file="conversation_log.json", level="basic/intermediate fluency"):
        super().__init__("tl", "Tagalog", model_name, feedback_language, log_file)
        self.user_level = level
        self.heritage_language = "Tagalog"

    def _build_conversation_prompt(self, user_input: str, context: str) -> str:
        """Build conversation prompt with Tagalog-specific cultural guidance."""
        topics_guidance = ""
        topic_integration_rules = ""
        
        if hasattr(self, 'user_topics') and self.user_topics and len(self.user_topics) > 0:
            topics_list = ', '.join(self.user_topics)
            topics_guidance = f"\n\nUSER'S PREFERRED TOPICS: {topics_list}"
            
            topic_integration_rules = f"""
TOPIC INTEGRATION REQUIREMENTS:
- PRIORITY: The user specifically wants to practice talking about: {topics_list}
- ALWAYS try to connect your response to one of these topics when contextually appropriate
- If the user's input relates to any of these topics, engage deeply with that topic
- If the conversation is generic, gently steer it toward their preferred topics
- Ask questions that encourage them to practice vocabulary related to: {topics_list}
- Share relatable experiences or comments about these topics to keep conversation flowing
- Examples of steering: If they say "kumusta ka?", you could respond about your day doing activities related to their topics

TOPIC-SPECIFIC CONVERSATION STARTERS:
- If user mentions or discusses any of their preferred topics ({topics_list}), expand on it enthusiastically
- If conversation is running dry, naturally introduce one of their topics
- Make your responses relevant to their learning goals around these specific subjects"""
        
        return f"""Conversational Heritage Language Tutor
You are a warm, culturally-aware AI language tutor designed specifically for heritage speakers who are relearning their heritage language.

The language for this conversation is: {self.heritage_language}.
User proficiency level: {self.user_level}{topics_guidance}

Your job is to:
Engage users in conversation that flows naturally and feels emotionally attuned, using phrasing and turns that sound like a real, friendly speaker of {self.feedback_language}.
Gently correct grammar and sentence structure.
Help users build confidence expressing themselves with cultural and emotional authenticity.
Support common challenges like code-switching, emotional phrasing, and politeness strategies.
CRITICAL: Your own responses in {self.heritage_language} must be grammatically correct and natural. You are teaching the language, so you cannot make mistakes in your responses.

{topic_integration_rules}

CONVERSATION FLOW RULES:
- Always respond to questions before asking your own.
- Follow natural {self.heritage_language} conversation patterns, not English-style turns.
- For yes/no questions, respond with an answer first before asking your follow-up.
- You can extend conversations not just by asking questions, but also by sharing relatable experiences, comments, or stories, and encouraging the user to share their own thoughts or feelings.
- Do not offer things you cannot actually give virtually (like food or drinks).

RESPONSE STRUCTURE:
- Respond naturally in {self.heritage_language} using appropriate vocabulary for heritage speakers (level: {self.user_level}).
- Use full sentences and correct verb tenses. Avoid unnecessary code-switching unless contextually or culturally appropriate.
- MATCH YOUR RESPONSE LENGTH TO THE USER'S INPUT. If the user gives a short, simple message, respond with a similarly concise response. Do not give long, detailed responses to short inputs. Keep the conversation flow natural and balanced.
- INCORPORATE USER'S PREFERRED TOPICS whenever contextually appropriate.

ADDITIONAL BEHAVIOR INSTRUCTIONS:
- Use {self.feedback_language} for explanations by default unless another language is requested.
- Speak like a friendly older sibling or patient tutor—warm, relaxed, and encouraging.
- Avoid robotic tone; make it feel like a real person helping them learn.

QUALITY CONTROL FOR YOUR RESPONSES:
- Before replying, double-check that your response is grammatically correct and natural, appropriate for the cultural and conversational context, and free from English-influenced sentence structures.
- Ensure your response connects to user's preferred topics when possible.

Current conversation context:
{context}

The user just said: "{user_input}"

Respond naturally in Tagalog following the guidelines above. REMEMBER to incorporate their preferred topics when contextually appropriate."""

    def _build_feedback_prompt(self, user_input: str, context: str) -> str:
        """Build detailed feedback prompt with Tagalog grammar rules."""
        grammar_rules = self._get_relevant_grammar_rules(user_input)
        cultural_guidance = self._get_relevant_cultural_guidance(user_input)
        
        return f"""You are a Tagalog language expert reviewing a heritage learner's input for grammar and cultural appropriateness.

USER INPUT: "{user_input}"
CONTEXT: {context}
USER LEVEL: {self.user_level}

{grammar_rules}

{cultural_guidance}

CHECK AND PROVIDE FEEDBACK ON:

1. VOWEL HARMONY ERRORS (ONLY when preceding word ends in vowel):
   - After words ending in vowels (a,e,i,o,u), change:
     * 'din' → 'rin' (e.g., 'hello din' → 'hello rin', 'okay din' → 'okay rin')
     * 'daw' → 'raw' (e.g., 'sabi daw' → 'sabi raw')
     * 'dito' → 'rito' (e.g., 'punta ka dito' → 'punta ka rito')
   - IMPORTANT: Do NOT change 'din' to 'rin' if the preceding word ends in a consonant
   - Examples of CORRECT usage: 'ganun din' (stays 'din'), 'trabaho din' (stays 'din')

2. VOCABULARY APPROPRIATENESS:
   - Replace inappropriate "Hay naku" (only use for genuine frustration)
   - Replace overused "Siyempre" with "Oo naman" or "Oo nga"
   - Replace formal greetings ("Magandang araw") with casual ones ("Hi", "Hello")
   - Make "Hindi" more polite by adding "naman" when appropriate

3. GRAMMAR CORRECTNESS:
   - Use correct verb tenses
   - Use proper sentence structure
   - Answer greetings before asking back
   - Answer questions before asking back

IMPORTANT: If there are no errors, say "No corrections needed - great job!" 
If there are errors, be encouraging and specific about improvements.
Provide feedback in {self.feedback_language}."""

    def _build_suggestions_prompt(self, context: str) -> str:
        """Build suggestions prompt specifically for Tagalog responses."""
        level_guidance = self._get_level_guidance()
        topics_guidance = self._get_topics_guidance()
        
        # Enhanced topic integration for suggestions
        topic_focus = ""
        if hasattr(self, 'user_topics') and self.user_topics and len(self.user_topics) > 0:
            topics_list = ', '.join(self.user_topics)
            topic_focus = f"""
CRITICAL TOPIC REQUIREMENTS:
- The user specifically wants to practice discussing: {topics_list}
- ALL THREE suggestions should relate to or incorporate these topics when possible
- If the conversation is not about their topics, suggest ways to introduce or transition to these topics
- Focus suggestions on vocabulary and phrases related to: {topics_list}
- Make suggestions that will help them practice speaking about their preferred subjects
- Examples: If topics include 'family', suggest phrases about family members, activities, or questions about family
- Examples: If topics include 'food', suggest phrases about cooking, eating, restaurants, or asking about food preferences

SUGGESTION PRIORITY ORDER:
1. First suggestion: Directly related to one of their preferred topics ({topics_list})
2. Second suggestion: Moderately related or transitional to their topics  
3. Third suggestion: Natural conversation flow that could lead to their topics"""
        
        return f"""You are a Tagalog language tutor providing conversation suggestions.
Below is the conversation context:
{context}

USER CONTEXT:
- Proficiency level: {self.user_level}
- {level_guidance}
- {topics_guidance}

{topic_focus}

Provide three possible follow-up replies the user could say to continue the conversation.
IMPORTANT: Focus suggestions around the user's preferred topics and make them highly relevant to what they want to practice.
Consider their proficiency level and ensure suggestions help them practice their specific interests.

Use this exact format:
---
Here are some ways you could respond:
[Simple Tagalog phrase] - [English translation]
[Slightly more complex Tagalog] - [English translation]
[Another natural option] - [English translation]
---

Make them natural, conversational, appropriate for their level, and STRONGLY connected to their preferred topics."""

    def _get_relevant_grammar_rules(self, user_input: str) -> str:
        """Get Tagalog-specific grammar rules relevant to user input."""
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

    def _get_relevant_cultural_guidance(self, user_input: str) -> str:
        """Get Tagalog-specific cultural guidance."""
        notes = []
        notes.append('- Use varied Filipino expressions instead of overusing "Hay naku". Natural options include: "ahh", "ay", "hala", "oo nga", "hindi naman", "ah ganon ba", "naku", "ay naku", "hala naman", "oo naman", "ay oo", "hindi kaya", "ay hindi", "ah talaga", "ay ganon", "hala sige", "oo sige", etc. Choose contextually appropriate expressions.')
        notes.append('- Use "po/opo" for politeness with elders or in formal situations.')
        notes.append('- "Kamusta" is more natural than "kumusta" in casual speech.')
        notes.append('- "Magandang araw" is formal; "Hi" or "Hello" is common among youth.')
        notes.append('- Avoid direct refusals; use polite, indirect language when declining.')
        notes.append('- Do NOT use "Hay naku" for boredom, mild surprise, or casual empathy. "Hay naku" is only for strong exasperation, frustration, or when something is truly troublesome.')
        notes.append('- For boredom or mild surprise, use "Ah, ganon ba?", "Ay, ganon pala?", "Naku, bored ka pala?", or "Ay, ganon?".')
        notes.append('- Example (Incorrect): "Hay naku, bored ka?" (unnatural)')
        notes.append('- Example (Correct): "Ah, ganon ba? Anong ginagawa mo?" or "Ay, ganon pala? Gusto mo magkwentuhan?"')
        return "CULTURAL GUIDANCE:\n" + "\n".join(notes)

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
def get_conversational_response(transcription: str, chat_history: List[Dict], language: str = 'en', user_level: str = 'beginner', user_topics: List[str] = None) -> str:
    """Get conversational response using separate Gemini call."""
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
    
    # Make separate Gemini call for conversation
    return tutor.get_conversational_response(transcription, context)

def get_detailed_feedback(phoneme_analysis: str, reference_text: str, recognized_text: str, chat_history: List[Dict], language: str = 'en', user_level: str = 'beginner', user_topics: List[str] = None) -> str:
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
    
    # Make separate Gemini call for feedback
    return tutor.get_detailed_feedback(recognized_text, context)

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

def get_translation(text: str, source_language: str = 'auto', target_language: str = 'en', breakdown: bool = False, user_topics: List[str] = None) -> dict:
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
            prompt = f"""Translate the following text and provide a detailed breakdown:

Text to translate: "{text}"
Source language: {source_language if source_language != 'auto' else 'detect automatically'}
Target language: {target_language}

Provide:
1. Translation: [Direct translation]
2. Breakdown: [Word-by-word or phrase-by-phrase explanation of key elements]

Format your response exactly as:
Translation: [your translation here]
Breakdown: [your breakdown here]"""
        else:
            prompt = f"""Translate the following text accurately:

Text: "{text}"
Source language: {source_language if source_language != 'auto' else 'detect automatically'}  
Target language: {target_language}

Provide only the translation, no additional explanation."""
        
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