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
        
        return f"""You are a helpful {self.language_name} language tutor having a conversation.

{level_guidance}
{topics_guidance}

Previous conversation:
{context}

The user just said: "{user_input}"

Respond naturally in {self.language_name}. Keep it friendly and encouraging, around 15-25 words. Try to keep the conversation going while considering their experience level and interests."""

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
            return f"User interests: {', '.join(self.user_topics)}. Try to incorporate these topics when appropriate."
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
        if hasattr(self, 'user_topics') and self.user_topics and len(self.user_topics) > 0:
            topics_guidance = f"\n\nUSER INTERESTS:\nThe user is interested in discussing: {', '.join(self.user_topics)}. Try to naturally incorporate these topics or steer conversation toward them when appropriate."
        
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
- If the user makes grammar or vocabulary mistakes, gently correct them in {self.feedback_language} after your main response, like a helpful friend would.

CORRECTION STYLE:
- If there are no errors, don't mention corrections.
- If there are errors, briefly point them out in {self.feedback_language} after your main response.
- Be encouraging and specific: "Instead of using 'X', you can sound more fluent if you use 'Y' instead."
- Keep corrections brief and friendly.

ADDITIONAL BEHAVIOR INSTRUCTIONS:
- Use {self.feedback_language} for explanations by default unless another language is requested.
- Speak like a friendly older sibling or patient tutor—warm, relaxed, and encouraging.
- Avoid robotic tone; make it feel like a real person helping them learn.

QUALITY CONTROL FOR YOUR RESPONSES:
- Before replying, double-check that your response is grammatically correct and natural, appropriate for the cultural and conversational context, and free from English-influenced sentence structures.

Example of natural flow:
User: "Kumusta ka?"
You: "Okay lang ako! Ikaw, kumusta ka?"

User: "Nakita ko sila kahapon sa mall at kain kami sa Jollibee."
You: "Ah, kumain kayo sa Jollibee! Anong inorder niyo? 
(By the way, it should be 'kumain kami' instead of 'kain kami' - 'kumain' is the past tense form.)"

Current conversation context:
{context}

The user just said: "{user_input}"

Respond naturally in Tagalog following the guidelines above."""

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
        
        return f"""You are a Tagalog language tutor.
Below is the conversation context:
{context}

USER CONTEXT:
- Proficiency level: {self.user_level}
- {level_guidance}
- {topics_guidance}

Provide three possible follow-up replies the user could say to continue the conversation.
Consider their proficiency level and interests when creating suggestions.
Use this exact format:
---
Here are some ways you could respond:
[Simple Tagalog phrase] - [English translation]
[Slightly more complex Tagalog] - [English translation]
[Another natural option] - [English translation]
---

Make them natural, conversational, and appropriate for their level and interests."""

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

# Main API functions using the modular approach
def get_conversational_response(transcription: str, chat_history: List[Dict], language: str = 'en', user_level: str = 'beginner', user_topics: List[str] = None) -> str:
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
        topics_guidance = ""
        if hasattr(self, 'user_topics') and self.user_topics and len(self.user_topics) > 0:
            topics_guidance = f"\n\nUSER INTERESTS:\nThe user is interested in discussing: {', '.join(self.user_topics)}. Try to naturally incorporate these topics or steer conversation toward them when appropriate."
        
        return f"""Conversational Heritage Language Tutor
You are a warm, culturally-aware AI language tutor designed specifically for heritage speakers who are relearning their heritage language.

The language for this conversation is: {self.heritage_language}.
User proficiency level: {self.level}{topics_guidance}

Your job is to:
Engage users in conversation that flows naturally and feels emotionally attuned, using phrasing and turns that sound like a real, friendly speaker of {self.feedback_language}.
Gently correct grammar and sentence structure.
Help users build confidence expressing themselves with cultural and emotional authenticity.
Support common challenges like code-switching, emotional phrasing, and politeness strategies.
CRITICAL: Your own responses in {self.heritage_language} must be grammatically correct and natural. You are teaching the language, so you cannot make mistakes in your responses.

CONVERSATION FLOW RULES:
- Always respond to questions before asking your own.
- Follow natural {self.heritage_language} conversation patterns, not English-style turns.
- For yes/no questions, respond with an answer first before asking your follow-up.
- You can extend conversations not just by asking questions, but also by sharing relatable experiences, comments, or stories, and encouraging the user to share their own thoughts or feelings.
- Do not offer things you cannot actually give virtually (like food or drinks).

RESPONSE STRUCTURE:
- Respond naturally in {self.heritage_language} using appropriate vocabulary for heritage speakers (level: {self.level}).
- Use full sentences and correct verb tenses. Avoid unnecessary code-switching unless contextually or culturally appropriate.
- MATCH YOUR RESPONSE LENGTH TO THE USER'S INPUT. If the user gives a short, simple message, respond with a similarly concise response. Do not give long, detailed responses to short inputs. Keep the conversation flow natural and balanced.
- If the user makes grammar or vocabulary mistakes, gently correct them in {self.feedback_language} after your main response, like a helpful friend would.

CORRECTION STYLE:
- If there are no errors, don't mention corrections.
- If there are errors, briefly point them out in {self.feedback_language} after your main response.
- Be encouraging and specific: "Instead of using 'X', you can sound more fluent if you use 'Y' instead."
- Keep corrections brief and friendly.

ADDITIONAL BEHAVIOR INSTRUCTIONS:
- Use {self.feedback_language} for explanations by default unless another language is requested.
- Speak like a friendly older sibling or patient tutor—warm, relaxed, and encouraging.
- Avoid robotic tone; make it feel like a real person helping them learn.

QUALITY CONTROL FOR YOUR RESPONSES:
- Before replying, double-check that your response is grammatically correct and natural, appropriate for the cultural and conversational context, and free from English-influenced sentence structures.

Example of natural flow:
User: "Kumusta ka?"
You: "Okay lang ako! Ikaw, kumusta ka?"

User: "Nakita ko sila kahapon sa mall at kain kami sa Jollibee."
You: "Ah, kumain kayo sa Jollibee! Anong inorder niyo? 
(By the way, it should be 'kumain kami' instead of 'kain kami' - 'kumain' is the past tense form.)"
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

    def check_and_fix_response(self, full_response: str, user_input: str) -> str:
        """Use a second LLM call to check and fix the main response, preserving the natural flow."""
        if not self.model or not GOOGLE_AI_AVAILABLE:
            return full_response
        
        # Since we're no longer using structured format, we'll check the entire response
        checker_prompt = f"""You are a {self.heritage_language} language expert reviewing a tutor's response for grammar and cultural appropriateness.

USER INPUT: "{user_input}"
TUTOR'S RESPONSE: "{full_response}"

CHECK AND FIX THESE SPECIFIC ERRORS:

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

3. RESPONSE LENGTH MATCHING:
   - If user input is short/simple, response should be similarly concise
   - Don't give long explanations to simple statements
   - Match the energy and detail level of the user's input

4. CULTURAL APPROPRIATENESS:
   - Don't reference long-standing relationships unless user mentioned it
   - Use natural, conversational tone
   - Avoid overly formal or academic language

5. GRAMMAR CORRECTNESS:
   - Use correct verb tenses
   - Use proper sentence structure
   - Answer greetings before asking back
   - Answer questions before asking back

IMPORTANT: Only make changes if there are actual errors. If the response is already correct, return it unchanged.

Provide ONLY the corrected response in natural conversation format. Do not include any formatting or labels."""

        try:
            checker_response = self.model.generate_content(checker_prompt)
            if checker_response and checker_response.text:
                corrected_response = checker_response.text.strip()
                
                # Debug: Print original vs corrected
                print(f"\n🔍 DEBUG - Original tutor response: {full_response}")
                print(f"🔍 DEBUG - Checker corrected to: {corrected_response}")
                
                return corrected_response
            else:
                return full_response
        except Exception as e:
            print(f"⚠️ Checker LLM failed: {str(e)}")
            return full_response

    def get_explanation_of_response(self, main_response: str, context: str = "") -> str:
        """Generate an explanation of the AI's main response (in feedback_language), using conversation context."""
        prompt = (
            f"You're helping a heritage speaker of {self.heritage_language} who is relearning the language.\n"
            f"Below is the conversation context including your most recent response:\n"
            f"{context}\n\n"
            f"Explain the response in {self.feedback_language} like a real person would - simple and natural.\n"
            f"When explaining what a {self.heritage_language} sentence means, don't just translate it.\n"
            f"Break down the sentence into parts, and explain why each phrase is used — including any nuance, tone, or cultural context (like politeness, typical phrasing, or emotional tone).\n"
            f"Keep the explanation natural and not too long — just a few short sentences per phrase. Avoid sounding like a textbook. Speak as if you're a friend helping someone understand how real conversations work.\n"
            f"\n"
            f"Explain your most recent response in {self.feedback_language} using this exact format:\n"
            f"---\n"
            f"\"[Key phrase]\"\n"
            f"[{self.feedback_language} meaning and cultural explanation]\n"
            f"\n"
            f"\"[Another phrase]\"\n"
            f"[{self.feedback_language} meaning and cultural explanation]\n"
            f"\n"
            f"[Continue for each important phrase]\n"
            f"---\n"
            f"\n"
            f"Focus on:\n"
            f"- What each phrase means in {self.feedback_language}\n"
            f"- Why you chose that specific wording\n"
            f"- Cultural context or conversational patterns\n"
            f"\n"
            f"Keep explanations conversational and natural, like you're explaining to a friend."
        )
        if self.model and GOOGLE_AI_AVAILABLE:
            try:
                response = self.model.generate_content(prompt)
                return response.text
            except Exception as e:
                return f"Unable to generate explanation: {str(e)}"
        else:
            return f"⚠️ Google AI not available. Set GOOGLE_API_KEY environment variable."

    def get_suggested_replies(self, main_response: str, context: str = "") -> str:
        """Generate suggested replies (in heritage language with English translation) for the user to continue the conversation, using conversation context."""
        prompt = (
            f"You are a {self.heritage_language} language tutor.\n"
            f"Below is the conversation context including your most recent response:\n"
            f"{context}\n\n"
            f"Provide three possible follow-up replies the user could say.\n"
            f"Use this format:\n"
            f"---\n"
            f"Here are some ways you could respond:\n"
            f"1. [Simple Tagalog phrase] - [English translation]\n"
            f"2. [Slightly more complex Tagalog] - [English translation]\n"
            f"3. [Another natural option] - [English translation]\n"
            f"---\n"
            f"\n"
            f"Make them natural, conversational, and appropriate for the context."
        )
        if self.model and GOOGLE_AI_AVAILABLE:
            try:
                response = self.model.generate_content(prompt)
                return response.text
            except Exception as e:
                return f"Unable to generate suggested replies: {str(e)}"
        else:
            return f"⚠️ Google AI not available. Set GOOGLE_API_KEY environment variable."

def extract_filipino_response(llm_output: str) -> str:
    """Extract only the Filipino conversational response from structured output."""
    # Look for Filipino Response section
    match = re.search(r'\*\*Filipino Response:\*\*\s*(.*?)(?=\*\*|$)', llm_output, re.DOTALL)
    if match:
        return match.group(1).strip()
    
    # Fallback patterns
    match = re.search(r'Main Response \([^)]+\):\s*(.*?)(?:\n\n|\*\*|$)', llm_output, re.DOTALL)
    if match:
        return match.group(1).strip()
    
    # If no structured format found, return first line/paragraph as response
    lines = llm_output.strip().split('\n')
    for line in lines:
        if line.strip() and not line.startswith('**') and not line.startswith('#'):
            return line.strip()
    
    return llm_output.strip()[:200]  # fallback

def extract_corrections(llm_output: str) -> str:
    """Extract corrections/feedback from structured output."""
    # Look for corrections section
    match = re.search(r'\*\*English Corrections:\*\*\s*(.*?)(?=\*\*|$)', llm_output, re.DOTALL)
    if match:
        return match.group(1).strip()
    
    # Look for error feedback section
    match = re.search(r'Error Feedback.*?:\s*(.*?)(?:\n\n|\*\*|$)', llm_output, re.DOTALL)
    if match:
        return match.group(1).strip()
    
    return ""

def extract_suggestions_from_response(llm_output: str) -> list:
    """Extract suggested replies from structured output."""
    suggestions = []
    
    # Look for follow-up question or suggestions
    match = re.search(r'\*\*Follow-up Question:\*\*\s*(.*?)(?=\*\*|$)', llm_output, re.DOTALL)
    if match:
        suggestions.append(match.group(1).strip())
    
    # Look for suggested replies section
    match = re.search(r'Suggested Replies.*?:\s*(.*?)(?:\*\*|$)', llm_output, re.DOTALL)
    if match:
        replies_text = match.group(1).strip()
        # Parse numbered or bulleted suggestions
        for line in replies_text.split('\n'):
            if line.strip() and (line.strip().startswith(('1.', '2.', '3.', '-', '•'))):
                # Extract the Filipino part before any dash or explanation
                suggestion = re.sub(r'^[0-9\.\-\•\s]*', '', line.strip())
                suggestion = suggestion.split(' - ')[0].strip()  # Take part before English translation
                if suggestion:
                    suggestions.append(suggestion)
    
    return suggestions[:3]  # Return max 3 suggestions

def extract_main_response(llm_output: str) -> str:
    """Legacy function - now routes to extract_filipino_response."""
    return extract_filipino_response(llm_output)

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
            _filipino_tutor_instance = FilipinoHeritageTutor(level=f"{user_level} fluency")
        
        # Update tutor instance with current user context
        _filipino_tutor_instance.level = f"{user_level} fluency"
        _filipino_tutor_instance.user_topics = user_topics
        
        # Build context from last 4 messages
        context = "\n".join([f"{msg['sender']}: {msg['text']}" for msg in chat_history[-4:]]) if chat_history else ""
        
        # Create enhanced context with user information
        user_context = f"User Level: {user_level}"
        if user_topics and len(user_topics) > 0:
            user_context += f" | Interests: {', '.join(user_topics)}"
        
        enhanced_context = f"{user_context}\n\nConversation:\n{context}" if context else user_context
        
        full_response = _filipino_tutor_instance.provide_conversational_response(transcription, enhanced_context)
        # Extract only the Filipino conversational part
        return extract_filipino_response(full_response)
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
                level_context = "You're talking to a heritage speaker who understands the language but needs confidence speaking. Use natural, everyday expressions."
            elif user_level == 'beginner':
                level_context = "You're talking to a beginner learner. Be encouraging and use simpler vocabulary and basic sentence structures."
            elif user_level == 'intermediate':
                level_context = "You're talking to an intermediate learner. You can use moderately complex structures and vocabulary."
            elif user_level == 'advanced':
                level_context = "You're talking to an advanced learner. Feel free to use complex vocabulary and idiomatic expressions."
            
            topics_context = ""
            if user_topics and len(user_topics) > 0:
                topics_context = f"Their preferred topics to discuss include: {', '.join(user_topics)}. Try to naturally incorporate these topics or steer conversation toward them when appropriate."
            
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
    if user_topics is None:
        user_topics = []
    if language == 'tl':
        if _filipino_tutor_instance is None:
            _filipino_tutor_instance = FilipinoHeritageTutor()
        # Use recognized_text as the main input, context from chat_history
        context = "\n".join([f"{msg['sender']}: {msg['text']}" for msg in chat_history[-4:]]) if chat_history else ""
        # Get the full structured response
        full_response = _filipino_tutor_instance.provide_conversational_response(recognized_text, context)
        # Extract only the corrections/feedback part
        corrections = extract_corrections(full_response)
        if corrections:
            return corrections
        else:
            return "No corrections needed - great job!"
    else:
        # Fallback: return a simple message
        return "[Gemini: Only Tagalog/Filipino ('tl') is supported for detailed feedback in this version.]"

def get_text_suggestions(chat_history: List[Dict], language: str = 'en', user_level: str = 'beginner', user_topics: List[str] = None) -> list:
    """Generate text suggestions for what the user could say next."""
    if user_topics is None:
        user_topics = []
    
    print(f"🔍 DEBUG - get_text_suggestions called with language: {language}")
    print(f"🔍 DEBUG - Chat history length: {len(chat_history) if chat_history else 0}")
    
    if language == 'tl':  # Tagalog/Filipino
        print("🔍 DEBUG - Processing Tagalog suggestions")
        
        global _filipino_tutor_instance
        if _filipino_tutor_instance is None:
            _filipino_tutor_instance = FilipinoHeritageTutor()
        
        # Generate suggestions using Gemini
        if chat_history and len(chat_history) > 0:
            try:
                # Build conversation context
                context = "\n".join([f"{msg['sender']}: {msg['text']}" for msg in chat_history[-4:]]) if chat_history else ""
                
                # Create suggestions prompt with user context
                level_guidance = ""
                if user_level == 'heritage':
                    level_guidance = "The user is a heritage speaker who understands the language but needs confidence speaking. Use natural, everyday expressions."
                elif user_level == 'beginner':
                    level_guidance = "The user is a beginner learner. Use simple vocabulary and basic sentence structures."
                elif user_level == 'intermediate':
                    level_guidance = "The user is an intermediate learner. You can use moderately complex structures and vocabulary."
                elif user_level == 'advanced':
                    level_guidance = "The user is an advanced learner. Feel free to use complex vocabulary and idiomatic expressions."
                
                topics_guidance = ""
                if user_topics and len(user_topics) > 0:
                    topics_guidance = f"The user is interested in discussing: {', '.join(user_topics)}. Try to incorporate these topics when appropriate."
                
                prompt = (
                    f"You are a Tagalog language tutor.\n"
                    f"Below is the conversation context:\n"
                    f"{context}\n\n"
                    f"USER CONTEXT:\n"
                    f"- Proficiency level: {user_level}\n"
                    f"- {level_guidance}\n"
                    f"- {topics_guidance}\n\n"
                    f"Provide three possible follow-up replies the user could say to continue the conversation.\n"
                    f"Consider their proficiency level and interests when creating suggestions.\n"
                    f"Use this exact format:\n"
                    f"---\n"
                    f"Here are some ways you could respond:\n"
                    f"[Simple Tagalog phrase] - [English translation]\n"
                    f"[Slightly more complex Tagalog] - [English translation]\n"
                    f"[Another natural option] - [English translation]\n"
                    f"---\n"
                    f"\n"
                    f"Make them natural, conversational, and appropriate for their level and interests."
                )
                
                print(f"🔍 DEBUG - Sending suggestions prompt to Gemini")
                
                if _filipino_tutor_instance.model and GOOGLE_AI_AVAILABLE:
                    response = _filipino_tutor_instance.model.generate_content(prompt)
                    if response and response.text:
                        print(f"🔍 DEBUG - Gemini response: {response.text}")
                        
                        # Parse the response to extract suggestions
                        suggestions = parse_suggestions_response(response.text)
                        if suggestions and len(suggestions) > 0:
                            print(f"🔍 DEBUG - Parsed {len(suggestions)} suggestions: {suggestions}")
                            return suggestions
                        
            except Exception as e:
                print(f"🔍 DEBUG - Error generating Gemini suggestions: {e}")
        
        # Fallback suggestions if Gemini fails or no chat history
        print("🔍 DEBUG - Using fallback suggestions")
        suggestions = [
            {
                "text": "Salamat sa pagtanong!",
                "translation": "Thank you for asking!"
            },
            {
                "text": "Gusto ko ring malaman yan.",
                "translation": "I'd like to know that too."
            },
            {
                "text": "Pwede mo bang ikwento pa?",
                "translation": "Can you tell me more?"
            }
        ]
        
        print(f"🔍 DEBUG - Returning {len(suggestions)} fallback suggestions")
        return suggestions
        
    else:
        print(f"🔍 DEBUG - Non-Tagalog language: {language}")
        suggestions = [
            {
                "text": f"Language '{language}' not supported",
                "translation": "Only Tagalog/Filipino ('tl') is supported for suggestions"
            }
        ]
        print(f"🔍 DEBUG - Returning fallback: {suggestions}")
        return suggestions

def parse_suggestions_response(response_text: str) -> list:
    """Parse Gemini response to extract suggestions in the format expected by frontend."""
    suggestions = []
    
    try:
        # Look for lines that match the pattern: [Tagalog text] - [English translation]
        lines = response_text.split('\n')
        for line in lines:
            line = line.strip()
            # Skip headers and empty lines
            if not line or line.startswith('---') or 'ways you could respond' in line.lower():
                continue
                
            # Look for pattern: [text] - [translation]
            if ' - ' in line:
                # Remove any leading bullets or numbers
                clean_line = line.strip('•-1234567890. ')
                
                parts = clean_line.split(' - ', 1)
                if len(parts) == 2:
                    tagalog_text = parts[0].strip('[]')
                    english_text = parts[1].strip('[]')
                    
                    if tagalog_text and english_text:
                        suggestions.append({
                            "text": tagalog_text,
                            "translation": english_text
                        })
                        
                        # Stop after 3 suggestions
                        if len(suggestions) >= 3:
                            break
    
    except Exception as e:
        print(f"Error parsing suggestions response: {e}")
    
    return suggestions

def get_translation(text: str, source_language: str = 'auto', target_language: str = 'en', breakdown: bool = False, user_topics: List[str] = None) -> dict:
    if user_topics is None:
        user_topics = []
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