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
    SCRIPT_LANGUAGES = {
        'hi': 'Devanagari',
        'ja': 'Japanese',
        'zh': 'Chinese',
        'ko': 'Korean',
        'ar': 'Arabic',
        'ta': 'Tamil',
    }

    CLOSENESS_LEVELS = {
        "intimate": "Intimate/Familiar: Very casual. Used with close friends, romantic partners, younger siblings, or yourself. Informal pronouns, dropped particles, relaxed tone.",
        "friendly": "Friendly/Peer: Casual or semi-formal. Used with classmates, coworkers, or equals. Informal but respectful tone; friendly pronouns.",
        "respectful": "Respectful/Polite: Polite and formal. Used with strangers, elders, teachers, or clients. Uses honorifics, full grammar, and avoids slang.",
        "formal": "Humble/Very Formal: Highly respectful. Used with seniors, officials, in ceremonies, or when showing deference. Uses humble language and elevated honorifics.",
        "distant": "Distant/Neutral: Detached or clinical. Used in formal writing, legal contexts, or cold interactions. Impersonal tone, no slang, and grammatically precise."
    }

    PROFICIENCY_LEVELS = {
        'beginner': "User is a beginner learner. Use very simple vocabulary and basic sentence structures.",
        'elementary': "User is an elementary learner. Use simple vocabulary and short, clear sentences.",
        'intermediate': "User is an intermediate learner. Use moderately complex structures and vocabulary.",
        'advanced': "User is an advanced learner. Use complex vocabulary and idiomatic expressions.",
        'fluent': "User is fluent. Use natural, native-level expressions and advanced vocabulary."
    }

    def __init__(self, language_code: str, language_name: str, model_name="gemini-2.5-flash", feedback_language="English", log_file="conversation_log.json"):
        self.language_code = language_code
        self.language_name = language_name
        self.feedback_language = feedback_language
        self.log_file = log_file
        self.conversation_id = datetime.now().strftime("%Y%m%d_%H%M%S")
        self.user_level = "beginner"
        self.user_topics = []
        self.user_goals = []
        self.user_closeness = "friendly"

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

        goals_guidance = ""
        if hasattr(self, 'user_goals') and self.user_goals and len(self.user_goals) > 0:
            goals_list = ', '.join(self.user_goals)
            goals_guidance = f"\n\nUSER'S LEARNING GOALS: {goals_list}"

        prompt = f"""Conversational Heritage Language Tutor  
You are a warm, culturally-aware AI tutor for a {self.user_level} heritage learner of {self.language_name}.

Your job is to engage users in natural, emotionally rich conversation that sounds like a real {self.language_name} speaker.
You have a {self.user_closeness} closeness level with the user and they are a {self.user_level} learner.
Adjust your tone, pronouns, and grammar to match this level of closeness: {self.CLOSENESS_LEVELS[self.user_closeness]}.
Adjust your vocabulary and sentence structure to match this level of proficiency: {self.PROFICIENCY_LEVELS[self.user_level]}.

IMPORTANT: Do not refer to yourself as a tutor, teacher, AI, or bot. Respond as a natural conversation partner would.

Follow natural conversation patterns:  
- Acknowledge before shifting topics: Respond to what the other person said when appropriate before introducing a new topic to maintain natural conversational flow.
- Share relatable experiences, comments, or stories to deepen connection but do not monopolize the conversation.
- Ensure the response's opening phrase logically follows the user's message; avoid using agreement or reaction phrases when the user has not made a statement to agree or react to yet.
- Your response should be concise: no longer than 10-25 words.
- Do not include translations in your response.

{self._get_cultural_rules()}

{topics_guidance}
{topic_integration_rules}
{goals_guidance}

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
        
        grammar_rules = self._get_grammar_rules()
        
        prompt = f"""
      
You are a kind, culturally-aware language tutor helping a heritage speaker improve their {self.language_name}.

Your job is to identify and gently explain any grammar or phrasing mistakes in the user's message. 
They are speaking with someone with a  {self.user_closeness} closeness level.
Ensure they are speaking with the correct appropriateness, tone, pronouns, and grammar to match this level of closeness: {self.CLOSENESS_LEVELS[self.user_closeness]}.
USER INPUT:
"{user_input}"

{grammar_rules}
{self._get_cultural_rules()}

YOUR RESPONSE STRUCTURE (use {self.feedback_language} for explanations):

- If the input is correct and natural, simply say:
"Correct, that sounds great!" or something similar with the same sentiment and length in {self.feedback_language}.

- If there are errors, follow this format:
  You said: "..."
  Correction: "..."
Explanation: Briefly explain why it was incorrect (e.g., verb tense, word order, unnatural phrasing, incorrect particle, politeness marker, closeness level, etc.) in {self.feedback_language}.

TIPS:
- Be encouraging and specific.
- Focus on grammar, natural sentence structure, and phrasing that sounds native.
- If the user used a non-{self.language_name} word that has a better equivalent, suggest a replacement like: "Instead of saying 'X', you'll sound more fluent if you say 'Y'." in {self.feedback_language}.

Speak like a friendly older sibling or patient tutor. Keep your tone warm, supportive, and helpful.
Always use {self.feedback_language} for explanations.
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

    def get_script_suggestion_example(self) -> str:
        """Return a script-language suggestion example for few-shot prompting. Override in subclasses."""
        return ""

    def get_suggestions(self, context: str = "") -> list:
        """Generate suggestions for what the user could say next."""
        if not getattr(self, 'model', None) or not GOOGLE_AI_AVAILABLE:
            return [{"text": "Keep practicing!", "translation": "Continue learning!"}]
        
        # Prepare proficiency level guidance
        level_guidance = self.PROFICIENCY_LEVELS.get(self.user_level, "")
        
        # Combine topic-related guidance
        topics_list = ', '.join(self.user_topics) if self.user_topics else ""
        topics_guidance = ""
        if topics_list:
            topics_guidance = f"""
- The user wants to focus on the following topics: {topics_list}
- CRITICAL: Connect replies to these topics whenever possible. If one has already been mentioned, expand naturally or ask a related question.
- If the conversation becomes generic, gently steer it back toward these topics.
"""

        # Begin prompt
        prompt = f"""
You are a culturally-aware AI tutor helping a heritage speaker of {self.language_name} continue a natural conversation.

Your goal is to generate fluent, emotionally attuned, and topic-relevant replies that help the learner stay engaged and build confidence using the language.

TASK:
The user may be unsure how to reply to the AI's last message. Suggest 3 natural responses they could say next, suited to a {self.user_closeness} closeness level.
Each should directly respond to the AI's most recent message, using this description of closeness: {self.CLOSENESS_LEVELS[self.user_closeness]}.
Try to gently incorporate the user's favorite topics where appropriate.

Conversation so far (latest message last):
{context}

USER INFO:
- Proficiency level: {self.user_level} ({level_guidance})
- Target translation language: {self.feedback_language}
{topics_guidance}

IMPORTANT:
– Use vocabulary and sentence structure appropriate for a {self.user_level} learner: {level_guidance}
– Each suggestion should be roughly the same length as the user's last message (or up to 1.5× longer)
– Do NOT use placeholders like [Song Title], [Artist's Name], or brackets
– Always provide real, natural-sounding examples that a native speaker would say
– The translation must always be in {self.feedback_language}. Only use English if {self.feedback_language} is English.

For each suggestion, also include a short explanation of what it means and how it would be used in the conversation. 
– Make the explanation as detailed as is helpful for the user's proficiency level.  
– If the phrase includes a cultural nuance or idiomatic structure, briefly explain it.
"""

        # Add format instructions for script-based languages
        if self.language_code in self.SCRIPT_LANGUAGES:
            prompt += f"""
Use this exact format for each suggestion:
[Simple {self.language_name} phrase] - [Romanized version] - [{self.feedback_language} translation]
Explanation: [brief explanation here]

[Slightly more complex {self.language_name} phrase] - [Romanized version] - [{self.feedback_language} translation]
Explanation: [brief explanation here]

[Another natural option] - [Romanized version] - [{self.feedback_language} translation]
Explanation: [brief explanation here]
"""
            example = self.get_script_suggestion_example()
            if example:
                prompt += f"\nExample:\n{example}\n"
        else:
            prompt += f"""
Use this exact format for each suggestion:
[Simple {self.language_name} phrase] - [{self.feedback_language} translation]
Explanation: [brief explanation here]

[Slightly more complex {self.language_name} phrase] - [{self.feedback_language} translation]
Explanation: [brief explanation here]

[Another natural option] - [{self.feedback_language} translation]
Explanation: [brief explanation here]
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

    def check_simple(self, user_input: str, main_response: str) -> str:
        """Check and fix the tutor's response for grammar and naturalness using Gemini 2.5 Pro."""
        if not GOOGLE_AI_AVAILABLE:
            return main_response
        try:
            import google.generativeai as genai
            checker_model = genai.GenerativeModel("gemini-2.5-pro")
        except Exception as e:
            print(f"Error loading Gemini 2.5 Pro model: {e}")
            return main_response
        # Add script language output instructions
        script_lang_instruction = f"Return ONLY the revised {self.language_name} response, with no explanation or formatting."
        if self.language_code in self.SCRIPT_LANGUAGES:
            script_lang_instruction = f"Return ONLY the revised {self.language_name} response and the romanized version, with no explanation or formatting."

        checker_prompt = f"""
Is the tutor's response grammatically, culturally, and pragmatically appropriate given the user's input?

USER INPUT: "{user_input}"  
TUTOR RESPONSE: "{main_response}"

USER INFO:
- Proficiency level: {self.user_level} ({self.PROFICIENCY_LEVELS[self.user_level]})
- Closeness level: {self.user_closeness} ({self.CLOSENESS_LEVELS[self.user_closeness]})
- Topics: {self.user_topics}

Carefully check that:
- The grammar, vocabulary, and tone match the user's fluency and relationship with the tutor.
- The response isn't too long, overwhelming, or asking too many questions at once.
- You have complete control to return a corrected version in {self.language_name} that fits the user's closeness and proficiency levels and touches on the provided topics if necessary.
- If the response is already natural and grammatically accurate, return it unchanged.

Abide by these {self._get_grammar_rules()}:

{script_lang_instruction}"""
        try:
            response = checker_model.generate_content(checker_prompt)
            if response and response.text:
                print(f"Checker prompt: {checker_prompt}")
                return response.text.strip()
            else:
                return main_response
        except Exception as e:
            print(f"Error in check_and_fix_response: {e}")
            return main_response

    def check_and_fix_response(self, user_input: str, main_response: str) -> str:
        """Check and fix the tutor's response for grammar and naturalness using Gemini 2.5 Pro."""
        if not GOOGLE_AI_AVAILABLE:
            return main_response
        try:
            import google.generativeai as genai
            checker_model = genai.GenerativeModel("gemini-2.5-pro")
        except Exception as e:
            print(f"Error loading Gemini 2.5 Pro model: {e}")
            return main_response
        # Add script language output instructions
        script_lang_instruction = "Return ONLY the revised {self.language_name} response, with no explanation or formatting."
        if self.language_code in self.SCRIPT_LANGUAGES:
            script_lang_instruction = f"\nReturn ONLY the revised {self.language_name} response and the romanized version, with no explanation or formatting.\n"

        checker_prompt = f"""You are a native-level {self.language_name} speaker and cultural insider reviewing a language tutor's response to a learner.

Your goal is to make sure the tutor's reply sounds natural, fluent, and culturally appropriate in everyday {self.language_name} conversation. The learner's original message and the tutor's response are shown below:

USER INPUT: "{user_input}"  
TUTOR RESPONSE: "{main_response}"

Revise the tutor's response if needed to:
– Correct grammar errors, including verb usage, sentence structure, and misplaced modifiers  
– Improve fluency to sound like natural, relaxed spoken {self.language_name}  
- Adjust the tone, pronouns, and grammar to match this level of closeness: {self.CLOSENESS_LEVELS[self.user_closeness]}.


{self._get_grammar_rules()}
{self._get_cultural_rules()}

Quality guidelines:
- Do not simplify responses that are already natural, engaging, and successfully guide the conversation with topic-relevant questions.
– Preserve natural personality and tone if the response is expressive or casual  
- Your response should be concise: no longer than 10-25 words.
- If the response is discussing a topic in {self.user_topics}, ensure the corrected response still incorporates it.
- If none of the topics in {self.user_topics} are being discussed, gently steer the conversation toward one of the user's topics.
– Only revise if there's something clearly off (e.g., awkward phrasing, grammatical error, unnatural structure) 
– Think like a real {self.language_name} speaker: would this feel smooth, correct, and relatable in conversation?
– If the response feels textbook-like or robotic, revise it to sound more like what a native speaker would say in casual conversation.

If the response is already natural and grammatically accurate, return it unchanged.
{script_lang_instruction}"""
        try:
            response = checker_model.generate_content(checker_prompt)
            if response and response.text:
                return response.text.strip()
            else:
                return main_response
        except Exception as e:
            print(f"Error in check_and_fix_response: {e}")
            return main_response

    def explain_llm_response(self, llm_response: str, user_input: str = "", context: str = "") -> str:
        """Explain the LLM's response to the user in a strict, structured way, tailored to their proficiency and feedback language."""
        if not self.model or not GOOGLE_AI_AVAILABLE:
            return f"Here's an explanation: {llm_response}"

        script_lang_instruction = "– [Romanized version]" if self.language_code in self.SCRIPT_LANGUAGES else ""
    
        prompt = f"""
        You are an expert {self.language_name} language tutor. Your job is to explain the following {self.language_name} response to a heritage learner at the {self.user_level} level.

    USER INFO:

    Feedback language: {self.feedback_language}

    Closeness level: {self.user_closeness} ({self.CLOSENESS_LEVELS.get(self.user_closeness, '')})

    Proficiency level: {self.user_level} ({self.PROFICIENCY_LEVELS[self.user_level]})

    CONTEXT (for reference only; do not include or explain it):
    {context}

    RESPONSE TO EXPLAIN:
    "{llm_response}"

    YOUR TASK:
    Write a clear, step-by-step explanation of the response above to help a heritage learner deeply understand both the meaning and structure. Use the format below:

    [AI Response only characters]
    Provide the full response in its original script.

    For each sentence in the response, repeat:
    [Sentence in original script] {script_lang_instruction}]

    Briefly explain the overall meaning, tone, and social context. Do NOT mention or reference the user's info, closeness, or proficiency in your explanation. Do not say things like "this matches your user info" or similar. Only focus on the meaning, structure, and cultural/grammatical breakdown of the response itself.

    Then provide a word-by-word or phrase-by-phrase breakdown as a list, with each line in this format (no subheading):
    e.g., नमस्ते (Namaste) – [your translation here in {self.feedback_language}]
    Keep grammar notes minimal and very clear (e.g., "past tense marker", "polite form", etc.) in {self.feedback_language}.

    After the word breakdown, include:
    Literal translation – a direct {self.feedback_language} rendering that shows word order (e.g., "You called what name?" but in {self.feedback_language})
    Sentence structure pattern – briefly explain the overall grammar structure (e.g., Subject–Verb–Object), and how it compares to {self.feedback_language}. Use simple terms suitable for the learner's level. Mention anything unusual the learner might not expect (e.g., omission of subjects, flexible word order, etc.).

    DETAILS:
    Keep your explanation concise, information-dense, and readable. Avoid fluff, labels, and unnecessary filler.
    Only use {self.feedback_language}. Do not use English unless the feedback language is English.
    Tailor your tone and depth of explanation based on the {self.user_level} and {self.user_closeness}.
    Explain any cultural or pragmatic nuances that may not be obvious to a learner.
    If the sentence is common in conversation, note that it's a typical phrase and whether it's used formally, informally, etc.
    Do not include headings like "High-level meaning" or "Literal translation" — embed those naturally into your explanation.

"""
        try:
            response = self.model.generate_content(prompt)
            if response and response.text:
                return response.text.strip()
            else:
                return f"Here's an explanation: {llm_response}"
        except Exception as e:
            print(f"Error in explain_llm_response: {e}")
            return f"Here's an explanation: {llm_response}"

    def get_explanation_rules(self) -> str:
        """Get language-specific explanation rules. To be implemented by subclasses."""
        return ""

    def _parse_suggestions(self, response_text: str) -> list:
        """Parse suggestions response into list format, supporting explanations and romanized forms."""
        suggestions = []
        lines = response_text.split('\n')
        i = 0
        while i < len(lines):
            line = lines[i].strip()
            if not line or line.startswith('---') or 'ways you could respond' in line.lower():
                i += 1
                continue
            # Remove any leading bullets or numbers
            clean_line = line.strip('•-1234567890. ')
            parts = clean_line.split(' - ')
            explanation = None
            # Look ahead for explanation line
            if i + 1 < len(lines):
                next_line = lines[i+1].strip()
                if next_line.lower().startswith('explanation:'):
                    explanation = next_line[len('explanation:'):].strip()
                    i += 1  # Skip explanation line in next iteration
            # Script language: expect 3 fields (characters, romanized, translation)
            if self.language_code in self.SCRIPT_LANGUAGES:
                if len(parts) == 3:
                    chars = parts[0].strip('[]')
                    romanized = parts[1].strip('[]')
                    translation = parts[2].strip('[]')
                    if chars and romanized and translation:
                        suggestions.append({
                            "text": chars,
                            "romanized": romanized,
                            "translation": translation,
                            "explanation": explanation or ""
                        })
                        if len(suggestions) >= 3:
                            break
            else:
                # Non-script language: expect 2 fields (text, translation)
                if len(parts) == 2:
                    text = parts[0].strip('[]')
                    translation = parts[1].strip('[]')
                    if text and translation:
                        suggestions.append({
                            "text": text,
                            "translation": translation,
                            "explanation": explanation or ""
                        })
                        if len(suggestions) >= 3:
                            break
            i += 1
        return suggestions if suggestions else self._get_fallback_suggestions()

    def _get_fallback_suggestions(self) -> list:
        """Get fallback suggestions when AI generation fails."""
        return [
            {"text": "Thank you!", "translation": "Thank you!"},
            {"text": "I understand.", "translation": "I understand."},
            {"text": "Can you tell me more?", "translation": "Can you tell me more?"}
        ]

    def _get_grammar_rules(self) -> str:
        """Get language-specific grammar rules. To be implemented by subclasses."""
        return ""

    def _get_cultural_rules(self) -> str:
        """Get language-specific cultural rules. To be implemented by subclasses."""
        return ""

    def get_closeness_description(self, key: str) -> str:
        """Return the closeness level description for the given key."""
        return self.CLOSENESS_LEVELS.get(key, "")

    def check_and_naturalize_feedback(self, user_input: str, feedback: str) -> str:
        """Check and revise feedback to be more natural, conversational, and encouraging."""
        if not self.model or not GOOGLE_AI_AVAILABLE:
            return feedback
        
        prompt = f"""
You are a friendly, supportive language tutor. Your job is to review the following feedback given to a learner about their message and revise it ONLY if it sounds stiff, overly formal, robotic, or not like something a real, encouraging tutor would say in conversation.

USER INPUT: "{user_input}"
FEEDBACK: "{feedback}"

If the feedback is already natural, warm, and encouraging, return it unchanged.
If it is too formal, stiff, or robotic, rewrite it to sound more like a real, supportive tutor: use natural, conversational language, contractions, and a friendly tone. Keep it concise and positive, but do not remove important corrections or explanations.

Return ONLY the improved feedback, with no explanation or formatting.
"""
        try:
            response = self.model.generate_content(prompt)
            if response and response.text:
                return response.text.strip()
            else:
                return feedback
        except Exception as e:
            print(f"Error in check_and_naturalize_feedback: {e}")
            return feedback

    def generate_conversation_performance_summary(self, chat_history: List[Dict], user_goals: List[str] = None) -> Dict[str, any]:
        """
        Generate a detailed error tracking and performance summary for a conversation using Gemini.
        Tracks mistake types, their frequency, repetition, and improvement. Outputs a summary with:
        - Title and short description of the conversation
        - Mistakes per 100 words (for graphing)
        - Categorized mistake/correction logs
        - Performance tags: what went well, what to work on, suggested next focus
        """
        if not GOOGLE_AI_AVAILABLE:
            return {
                "title": None,
                "description": None,
                "mistakes_per_100_words": None,
                "mistake_log": [],
                "performance_tags": {},
                "summary": "[Gemini not available]"
            }

        context = "\n".join([f"{msg['sender']}: {msg['text']}" for msg in chat_history])
        goals_str = f"\nUSER GOALS: {', '.join(user_goals)}" if user_goals else ""

        prompt = f"""
You are an expert language learning coach and error analyst. Given the full conversation below, analyze the user's performance for error tracking and progress measurement.

CONVERSATION HISTORY:
{context}
{goals_str}

TASKS:
1. Generate a short, descriptive title (max 8 words) that captures the main topic or theme of the conversation.
2. Write a concise description (1-2 sentences) summarizing what was discussed, the tone, important cultural or heritage points, and any key moments or learning points.
3. Identify and categorize all mistakes made by the user (grammar, word order, code-switching, missing pronouns, etc.).
4. Track whether the same mistake types repeat or are corrected later in the conversation.
5. Calculate the total number of mistakes and the number of words spoken by the user. Compute "mistakes per 100 words" (round to 1 decimal place).
6. Output a categorized log of mistakes and corrections, e.g.:
   - Missed linking particle ("na") → Used correctly later that convo.
   - Code-switched to English ("I went to the tindahan")
   - Repeated tense error ("nagpunta ako go" x2)
7. Summarize performance with tags in {self.feedback_language}:
   - What went well (e.g., "You asked 2 great follow-up questions")
   - What to work on (e.g., "Practice using past tense verbs")
   - Suggested next focus (based on mistake patterns and goals not yet achieved)
8. Output a short, readable summary for a timeline or streak board, e.g.:
   Week 1: "Talked about family" ✅ / "Used past tense" ⚠️ / "Avoided English code-switching" ✅

FORMAT:
Return your answer in this format:
- title: string
- description: string
- mistakes_per_100_words: number
- mistake_log: list of strings (each a categorized log entry)
- performance_tags: dict with keys 'went_well', 'work_on', 'next_focus' (each a string)
- summary: short string for timeline display
"""
        try:
            model = genai.GenerativeModel("gemini-2.5-pro")
            response = model.generate_content(prompt)
            if response and response.text:
                # Parse the response text to extract the structured data
                lines = response.text.strip().split('\n')
                result = {
                    "title": None,
                    "description": None, 
                    "mistakes_per_100_words": None,
                    "mistake_log": [],
                    "performance_tags": {},
                    "summary": ""
                }
                
                current_section = None
                for line in lines:
                    line = line.strip()
                    if not line:
                        continue
                        
                    if line.lower().startswith('title:'):
                        result["title"] = line[len('title:'):].strip()
                    elif line.lower().startswith('description:'):
                        result["description"] = line[len('description:'):].strip()
                    elif line.lower().startswith('mistakes_per_100_words:'):
                        try:
                            value = line.split(':', 1)[1].strip()
                            result["mistakes_per_100_words"] = float(value)
                        except:
                            pass
                    elif line.lower().startswith('mistake_log:'):
                        current_section = 'mistake_log'
                    elif line.lower().startswith('performance_tags:'):
                        current_section = 'performance_tags'
                    elif line.lower().startswith('summary:'):
                        result["summary"] = line[len('summary:'):].strip()
                    elif line.startswith('- ') and current_section == 'mistake_log':
                        result["mistake_log"].append(line[2:])
                    elif ':' in line and current_section == 'performance_tags':
                        key, value = line.split(':', 1)
                        result["performance_tags"][key.strip()] = value.strip()
                
                return result
            else:
                return {"title": None, "description": None, "mistakes_per_100_words": None, "mistake_log": [], "performance_tags": {}, "summary": "[No response from Gemini]"}
        except Exception as e:
            print(f"Error generating conversation performance summary: {e}")
            return {"title": None, "description": None, "mistakes_per_100_words": None, "mistake_log": [], "performance_tags": {}, "summary": str(e)} 

# Tagalog-specific tutor with grammar rules and cultural context
class TagalogHeritageTutor(LanguageTutor):
    def __init__(self, model_name="gemini-2.5-flash", feedback_language="English", log_file="conversation_log.json", level="basic/intermediate fluency"):
        super().__init__("tl", "Tagalog", model_name, feedback_language, log_file)
        self.user_level = level
        self.heritage_language = "Tagalog"

    def _get_grammar_rules(self) -> str:
        """Get Tagalog-specific grammar rules for response checking."""
        return """Tagalog grammar rules:
– Use the correct form of discourse particles (e.g., "po", "din/rin", "daw/raw", "ng/nang", "dito/rito") based on context  
    → For example: use "rin" after a word ending in a vowel, and "din" after a consonant  (ex. "hello din" → "hello rin")
Example of unnatural vs. natural phrasing:
- Unnatural: Samahan kita mag-usap.  
- Natural: Usap tayo! / Kwentuhan tayo! / Nandito ako kung gusto mong magkwento.
- Make sure the response is natural and appropriately targeted (e.g., "ano'ng balita sa'yo?" is more relevant than "ano'ng balita?")
– Be aware of commonly fused clitic forms (e.g., "mong", "kang", "bang", "anong"), which combine pronouns or particles with the linker "ng" to streamline phrasing; these are not contractions, but grammatical shortcuts that differ in meaning or tone from their separated counterparts ("wag mong isipin" vs. "wag mo nang isipin").
- Avoid using partial reduplications (e.g., mainit-init, gutom-gutom, lamig-lamig) unless they are contextually natural and common in everyday speech. 
- Ensure that all verbs match the intended tense or aspect based on context (e.g., if the user says they just ate, use the completed form like 'kumain lang ako', not the future form 'kakain').
"""

    def _get_cultural_rules(self) -> str:
        """Get Tagalog-specific cultural rules for response checking."""
        return f"""Tagalog cultural rules:\n- Avoid overusing "Hay naku" — use varied expressions like "ahh", "hala", "oo nga", "ay naku", "ah talaga", "ay oo", etc. Choose based on context."""

    def _get_fallback_suggestions(self) -> list:
        """Get Tagalog-specific fallback suggestions."""
        return [
            {"text": "Salamat sa pagtanong!", "translation": "Thank you for asking!"},
            {"text": "Gusto ko ring malaman yan.", "translation": "I'd like to know that too."},
            {"text": "Pwede mo bang ikwento pa?", "translation": "Can you tell me more?"}
        ]

class JapaneseHeritageTutor(LanguageTutor):
    CLOSENESS_LEVELS = {
        "intimate": "Intimate/Familiar: Highly casual and emotionally close. Used with romantic partners, childhood friends, or younger siblings. Often omits particles and subjects, uses casual verbs and pronouns like 'あたし' or 'お前', and may include teasing or affectionate tone.",
        "friendly": "Friendly/Peer: Casual but warm and respectful. Used with friends, classmates, or coworkers of the same rank. Informal contractions are okay, but speech stays kind. Pronouns like '僕', '私', '君' may be used depending on gender and context.",
        "respectful": "Respectful/Polite: Standard polite speech. Used with new acquaintances, teachers, or older strangers. Uses 〜です/〜ます forms, full particles, and avoids slang. Pronouns like '私' and honorifics like 'さん' are expected.",
        "formal": "Humble/Very Formal: Extra-deferential. Used in business, ceremonies, or with people of much higher status. Includes keigo (respect/humble forms), honorifics like '様', and often omits direct personal references. Very structured grammar.",
        "distant": "Distant/Neutral: Emotionally neutral or detached. Used in news reporting, legal or academic writing, or conflict scenarios. Impersonal tone, avoids pronouns, no contractions or slang, strictly grammatical and objective."
    }
    PROFICIENCY_LEVELS = {
        'beginner': "Japanese: Use extremely simple, short sentences. Stick to basic grammar and common words only.",
        'elementary': "Japanese: Use simple, clear sentences. Introduce basic particles and common expressions.",
        'intermediate': "Japanese: Use moderately complex sentences, introduce some idioms, and use natural spoken forms.",
        'advanced': "Japanese: Use complex grammar, idiomatic phrases, and natural conversational flow.",
        'fluent': "Japanese: Use native-level expressions, advanced grammar, and culturally nuanced language."
    }
    def __init__(self, model_name="gemini-2.5-flash", feedback_language="English", log_file="conversation_log.json", level="basic/intermediate fluency"):
        super().__init__("ja", "Japanese", model_name, feedback_language, log_file)
        self.user_level = level
        self.heritage_language = "Japanese"

    def _get_grammar_rules(self) -> str:
        """Get Japanese-specific grammar rules for response checking."""
        return """Japanese grammar rules:
- Use correct word order: Subject–Object–Verb (SOV).
- Use appropriate particles (e.g., は, が, を, に, で, へ, と, も, から, まで) to mark grammatical roles.
- Match verb endings and politeness level (casual: だ/る, polite: です/ます, honorific/humble forms for formal situations).
- Omit the subject or object when it is clear from context (common in natural conversation).
- Use topic marker は to introduce or shift the topic, but avoid overusing it in short exchanges.
- Use correct counters and numbers for counting objects, people, etc.
- Use natural sentence-final particles (e.g., ね, よ, かな, か) to convey nuance, but avoid overusing them.
- Avoid direct, literal translations from English that sound unnatural in Japanese.
- Use appropriate pronouns (私, 僕, 俺, あなた, 君, etc.) based on gender, formality, and relationship, but omit when possible.
- Use natural contractions and colloquial forms in casual speech (e.g., じゃない instead of ではない).
- Avoid overusing personal pronouns; Japanese often omits them when understood from context.
- Use correct tense and aspect (e.g., 〜ている for ongoing actions, 〜た for completed actions).
- Use honorifics (さん, ちゃん, くん, 様) appropriately based on relationship and context.
"""

    def _get_cultural_rules(self) -> str:
        return """Japanese Cultural and Conversational Norms:
- Japanese conversation often emphasizes humility, indirectness, and listening.
- Avoid overly assertive or personal questions too early in a conversation.
- Be sensitive to levels of formality: casual forms (e.g., だ, ね) vs polite forms (です, ます).
- It's common to mirror the user's politeness level unless correcting overly robotic or textbook responses.
- Avoid sounding too stiff or mechanical. Use interjections like あ、へぇ、そうなんだ、えっと to sound natural.
– Avoid overly stiff or rare honorific forms (e.g., "〜くださいませんか") unless the closeness level is very formal or business-like.
- Use culturally appropriate expressions when reacting, such as すごい、いいね、なるほど.
- Avoid excessive use of 私 especially when referring to oneself repeatedly in short exchanges.
"""

    def get_script_suggestion_example(self) -> str:
        return """趣味は読書です。 - Shumi wa dokusho desu. - My hobby is reading.
最近はミステリー小説にハマってます。 - Saikin wa misuterī shōsetsu ni hamattemasu. - Lately, I'm really into mystery novels.
休日はカフェでゆっくり過ごすのが好きです。 - Kyūjitsu wa kafe de yukkuri sugosu no ga suki desu. - On my days off, I like to relax at a café.   """

class KoreanHeritageTutor(LanguageTutor):
    CLOSENESS_LEVELS = {
        "intimate": "Intimate/Familiar: Highly casual, used with close friends, romantic partners, or younger siblings. Frequent use of 반말 (banmal), omits honorifics, uses casual pronouns like '나' (I), '너' (you), and may include playful or affectionate tone.",
        "friendly": "Friendly/Peer: Casual but polite, used with classmates, coworkers of similar age, or friends not extremely close. May use 반말 (banmal) or switch to 존댓말 (jondaetmal) as needed. Pronouns like '나', '너', and some polite endings.",
        "respectful": "Respectful/Polite: Standard polite speech (존댓말), used with strangers, elders, teachers, or in most public situations. Uses full honorifics, polite verb endings like -요, and avoids slang. Pronouns like '저' (I), '당신' (you, rarely used), and honorifics like '씨', '님'.",
        "formal": "Humble/Very Formal: Extra-deferential, used in business, ceremonies, or with people of much higher status. Uses highest honorifics, formal verb endings like -습니다, and avoids direct personal references. Very structured grammar.",
        "distant": "Distant/Neutral: Emotionally neutral or detached, used in news, legal, or academic writing, or conflict. Impersonal tone, avoids pronouns, no contractions or slang, strictly grammatical and objective."
    }
    PROFICIENCY_LEVELS = {
        'beginner': "Korean: Use extremely simple, short sentences. Stick to basic grammar and common words only.",
        'elementary': "Korean: Use simple, clear sentences. Introduce basic particles and common expressions.",
        'intermediate': "Korean: Use moderately complex sentences, introduce some idioms, and use natural spoken forms.",
        'advanced': "Korean: Use complex grammar, idiomatic phrases, and natural conversational flow.",
        'fluent': "Korean: Use native-level expressions, advanced grammar, and culturally nuanced language."
    }
    def __init__(self, model_name="gemini-2.5-flash", feedback_language="English", log_file="conversation_log.json", level="basic/intermediate fluency"):
        super().__init__("ko", "Korean", model_name, feedback_language, log_file)
        self.user_level = level
        self.heritage_language = "Korean"

    def _get_grammar_rules(self) -> str:
        return """Korean grammar rules:
        - Use the correct speech level (반말 banmal for casual, 존댓말 jondaetmal for polite/formal).
        - Check verb endings for politeness and formality (-요, -습니다, etc.).
        - Use appropriate particles (이/가, 은/는, 을/를, 에/에서, etc.).
        - Avoid direct translations from English that sound unnatural in Korean.
        - Confirm proper use of honorifics and address terms.
        - Avoid overusing pronouns; Korean often omits the subject when understood.
        - Use natural sentence-final forms and avoid redundant subjects.
        - Avoid unnecessary interjections (e.g., 네, 음) unless they serve a clear conversational or emotional purpose."""

    def _get_cultural_rules(self) -> str:
        return """Korean Cultural and Conversational Norms:
        - Korean conversation emphasizes respect, humility, and indirectness.
        - Use appropriate honorifics and speech levels based on age and relationship.
        - Avoid overly assertive or personal questions too early in a conversation.
        - Be sensitive to levels of formality: casual forms (반말) vs polite forms (존댓말).
        - Mirror the user's politeness level unless correcting overly robotic or textbook responses.
        - Use culturally appropriate expressions when reacting, such as 와, 진짜, 대박, 그래요.
        - Avoid excessive use of pronouns, especially when referring to oneself or the listener."""

    def get_script_suggestion_example(self) -> str:
        return """요즘 뭐 해요? - Yojum mwo haeyo? - What are you up to these days?
        좋아하는 음식이 뭐예요? - Joh-ahaneun eumsigi mwoyeyo? - What food do you like?
        주말에 뭐 했어요? - Jumare mwo haesseoyo? - What did you do on the weekend?   """

class MandarinChineseHeritageTutor(LanguageTutor):
    CLOSENESS_LEVELS = {
        "intimate": "Intimate/Familiar: Highly casual, used with very close friends, romantic partners, or younger siblings. Frequent use of informal expressions, omission of subjects/particles, and relaxed tone.",
        "friendly": "Friendly/Peer: Casual but polite, used with classmates, coworkers, or acquaintances of similar age/status. Allows informal language but keeps a respectful tone.",
        "respectful": "Respectful/Polite: Standard polite speech, used with elders, teachers, strangers, or in formal social settings. Uses polite forms like 请 (qǐng), 您 (nín), avoids slang.",
        "formal": "Humble/Very Formal: Extra-deferential, used in business, official, or ceremonial settings. Includes set phrases, humble speech (谦辞), and avoids direct personal references.",
        "distant": "Distant/Neutral: Emotionally detached or objective, used in news reports, legal documents, or academic writing. Avoids pronouns, idioms, and contractions; emphasizes clarity and formality."
}

    PROFICIENCY_LEVELS = {
        'beginner': "Chinese: Use extremely simple, short sentences. Stick to basic grammar and common words only.",
        'elementary': "Chinese: Use simple, clear sentences. Introduce basic particles and common expressions.",
        'intermediate': "Chinese: Use moderately complex sentences, introduce some idioms, and use natural spoken forms.",
        'advanced': "Chinese: Use complex grammar, idiomatic phrases, and natural conversational flow.",
        'fluent': "Chinese: Use native-level expressions, advanced grammar, and culturally nuanced language."
    }
    def __init__(self, model_name="gemini-2.5-flash", feedback_language="English", log_file="conversation_log.json", level="basic/intermediate fluency"):
        super().__init__("zh", "Mandarin Chinese", model_name, feedback_language, log_file)
        self.user_level = level
        self.heritage_language = "Mandarin Chinese"

    def _get_grammar_rules(self) -> str:
        return """Mandarin Chinese grammar rules:
- Use correct word order: Subject-Verb-Object (SVO).
- Avoid unnecessary pronouns; Mandarin often omits the subject when it is clear from context.
- Use appropriate measure words (e.g., 一个, 本, 只) with nouns.
- Check verb aspect particles (了, 过, 着) for completed, experienced, or ongoing actions.
- Use correct question particles (吗, 呢, 吧) and sentence-final particles for tone.
- Avoid direct translation from English that sounds unnatural in Mandarin (e.g., avoid overusing "是" as a linking verb).
- Use natural sentence-final forms and avoid redundant subjects.
- Avoid unnecessary interjections (e.g., 嗯, 哦) unless they serve a clear conversational or emotional purpose.
- Use polite forms when appropriate (e.g., 请, 麻烦, 劳驾)."""

    def _get_cultural_rules(self) -> str:
        return """Mandarin Chinese Cultural and Conversational Norms:
- Mandarin conversation often emphasizes humility, indirectness, and respect for hierarchy.
- Use appropriate forms of address (e.g., 先生, 小姐, 老师) based on relationship and context.
- Avoid overly assertive or personal questions too early in a conversation.
- Be sensitive to levels of formality: casual forms with friends, polite forms with elders or strangers.
- Mirror the user's politeness level unless correcting overly robotic or textbook responses.
- Use culturally appropriate expressions when reacting, such as 真的吗, 太好了, 不错, 没关系.
- Avoid excessive use of pronouns, especially when referring to oneself or the listener.
- Avoid direct refusals; use polite, indirect language when declining or disagreeing."""

    def get_script_suggestion_example(self) -> str:
        return """你最近怎么样？ - Nǐ zuìjìn zěnmeyàng? - How have you been recently?
我喜欢吃中国菜。 - Wǒ xǐhuān chī Zhōngguó cài. - I like to eat Chinese food.
周末你有什么计划？ - Zhōumò nǐ yǒu shénme jìhuà? - Do you have any plans for the weekend?   """

    def explain_llm_response(self, llm_response: str, user_input: str = "", context: str = "") -> str:
        """Explain the LLM's response to the user in a strict, structured way, tailored to their proficiency and feedback language."""
        if not self.model or not GOOGLE_AI_AVAILABLE:
            return f"Here's an explanation: {llm_response}"
    
        prompt = f"""
        You are an expert {self.language_name} language tutor. Your job is to explain the following {self.language_name} response to a heritage learner at the {self.user_level} level.

    USER INFO:

    Feedback language: {self.feedback_language}

    Closeness level: {self.user_closeness} ({self.CLOSENESS_LEVELS.get(self.user_closeness, '')})

    Proficiency level: {self.user_level} ({self.PROFICIENCY_LEVELS[self.user_level]})

    CONTEXT (for reference only; do not include or explain it):
    {context}

    RESPONSE TO EXPLAIN:
    "{llm_response}"

    YOUR TASK:
    Write a clear, step-by-step explanation of the response above to help a heritage learner deeply understand both the meaning and structure. Use the format below:

    [AI Response only characters]
    Provide the full response in its original script.

    For each sentence in the response, repeat:
    [Sentence in original script] – [Romanized version if applicable]

    Briefly explain the overall meaning, tone, and social context. Do NOT mention or reference the user's info, closeness, or proficiency in your explanation. Do not say things like "this matches your user info" or similar. Only focus on the meaning, structure, and cultural/grammatical breakdown of the response itself.

    Then provide a word-by-word or phrase-by-phrase breakdown as a list, with each line in this format (no subheading):
    e.g., नमस्ते (Namaste) – [your translation here in {self.feedback_language}]
    Keep grammar notes minimal and very clear (e.g., "past tense marker", "polite form", etc.) in {self.feedback_language}.

    After the word breakdown, include:
    Literal translation – a direct {self.feedback_language} rendering that shows word order (e.g., "You called what name?" but in {self.feedback_language})
    Sentence structure pattern – briefly explain the overall grammar structure (e.g., Subject–Verb–Object), and how it compares to {self.feedback_language}. Use simple terms suitable for the learner's level. Mention anything unusual the learner might not expect (e.g., omission of subjects, flexible word order, etc.).

    DETAILS:
    Keep your explanation concise, information-dense, and readable. Avoid fluff, labels, and unnecessary filler.
    Only use {self.feedback_language}. Do not use English unless the feedback language is English.
    Tailor your tone and depth of explanation based on the {self.user_level} and {self.user_closeness}.
    Explain any cultural or pragmatic nuances that may not be obvious to a learner.
    If the sentence is common in conversation, note that it's a typical phrase and whether it's used formally, informally, etc.
    Do not include headings like "High-level meaning" or "Literal translation" — embed those naturally into your explanation.

"""
        try:
            response = self.model.generate_content(prompt)
            if response and response.text:
                return response.text.strip()
            else:
                return f"Here's an explanation: {llm_response}"
        except Exception as e:
            print(f"Error in explain_llm_response: {e}")
            return f"Here's an explanation: {llm_response}"


class HindiHeritageTutor(LanguageTutor):
    CLOSENESS_LEVELS = {
        "intimate": "Intimate/Familiar: Highly casual, used with very close friends, romantic partners, or younger siblings. Frequent use of informal expressions, omission of subjects, and relaxed tone.",
        "friendly": "Friendly/Peer: Casual but polite, used with classmates, coworkers, or acquaintances of similar age/status. Allows informal language but keeps a respectful tone.",
        "respectful": "Respectful/Polite: Standard polite speech, used with elders, teachers, strangers, or in formal social settings. Uses polite forms like जी (ji), avoids slang.",
        "formal": "Humble/Very Formal: Extra-deferential, used in business, official, or ceremonial settings. Includes set phrases, humble speech, and avoids direct personal references.",
        "distant": "Distant/Neutral: Emotionally detached or objective, used in news reports, legal documents, or academic writing. Avoids pronouns, idioms, and contractions; emphasizes clarity and formality."
    }
    PROFICIENCY_LEVELS = {
        'beginner': "Hindi: Use extremely simple, short sentences. Stick to basic grammar and common words only.",
        'elementary': "Hindi: Use simple, clear sentences. Introduce basic particles and common expressions.",
        'intermediate': "Hindi: Use moderately complex sentences, introduce some idioms, and use natural spoken forms.",
        'advanced': "Hindi: Use complex grammar, idiomatic phrases, and natural conversational flow.",
        'fluent': "Hindi: Use native-level expressions, advanced grammar, and culturally nuanced language."
    }
    def __init__(self, model_name="gemini-2.5-flash", feedback_language="English", log_file="conversation_log.json", level="basic/intermediate fluency"):
        super().__init__("hi", "Hindi", model_name, feedback_language, log_file)
        self.user_level = level
        self.heritage_language = "Hindi"

    def _get_grammar_rules(self) -> str:
        return """Hindi grammar rules:
- Use correct word order: Subject-Object-Verb (SOV).
- Use appropriate postpositions (e.g., को, से, में, पर) instead of prepositions.
- Match gender and number agreement between nouns, adjectives, and verbs.
- Use correct verb conjugations for tense, aspect, and politeness.
- Avoid overusing or misplacing honorifics like 'जी'. Use them naturally and respectfully.
- Avoid direct translation from English that sounds unnatural in Hindi (e.g., avoid overusing 'हूँ' or 'है' as a filler).
- Use natural sentence-final forms and avoid redundant subjects.
- Avoid unnecessary interjections (e.g., अच्छा, हाँ) unless they serve a clear conversational or emotional purpose.
- Use polite forms when appropriate (e.g., कृपया, धन्यवाद, ज़रा).
- **Always use the gender-neutral form of 'you' ('aap') and similar pronouns by default, unless the context clearly requires a gendered form.** Do not assume the gender of the person being addressed. If a gendered form is used (like 'tum' or 'tu'), explain why and what the alternative would be. Masculine and feminine forms should be explained to the learner when relevant (e.g., adjectives and verbs may change form based on gender)."""

    def _get_cultural_rules(self) -> str:
        return """Hindi Cultural and Conversational Norms:
- Hindi conversation often emphasizes respect, humility, and indirectness, especially with elders or strangers.
- Use appropriate forms of address (e.g., जी, श्रीमान, श्रीमती, भैया, दीदी) based on relationship and context.
- Avoid overly assertive or personal questions too early in a conversation.
- Be sensitive to levels of formality: casual forms with friends, polite forms with elders or strangers.
- Mirror the user's politeness level unless correcting overly robotic or textbook responses.
- Use culturally appropriate expressions when reacting, such as सच में, वाह, बहुत अच्छा, कोई बात नहीं.
- Avoid excessive use of pronouns, especially when referring to oneself or the listener.
- Avoid direct refusals; use polite, indirect language when declining or disagreeing."""

    def get_explanation_rules(self) -> str:
        return """Hindi explanation rules:
- Always explain the form of 'you' (and 'your') used in the response (e.g., 'aap', 'tum', 'tu', 'aapka', 'tumhara', 'tera').
- State whether it is formal/polite, informal, or intimate, and for which situations or relationships it is used (e.g., elders, friends, children).
- Briefly show how the form would change for masculine/feminine, singular/plural, and for different closeness levels. Give examples: e.g., 'aapka' (formal/masculine), 'aapki' (formal/feminine), 'tumhara/tumhari', 'tera/teri'.
- Relate the form used to the user's {self.user_closeness} closeness level.
- If a gendered or informal form is used, explain the social and grammatical implications.
- Do not reference the AI, tutor, or learner in your explanation. Just describe the language and its usage neutrally, as if explaining to any interested person."""
    def get_script_suggestion_example(self) -> str:
        return """நீங்கள் எப்படி இருக்கிறீர்கள்? - Neenga epadi irukkireergal? - How are you?
எனக்கு தமிழ் பேச விருப்பம். - Enakku Tamil pesa viruppam. - I like to speak Tamil.
உங்கள் பிடித்த உணவு என்ன? - Ungal piditha unavu enna? - What is your favorite food?   """

class MalayalamHeritageTutor(LanguageTutor):
    CLOSENESS_LEVELS = {
        "intimate": "Intimate/Familiar: Highly casual, used with very close friends, romantic partners, or younger siblings. Frequent use of informal expressions, relaxed tone, and sometimes omission of pronouns.",
        "friendly": "Friendly/Peer: Casual but polite, used with classmates, coworkers, or acquaintances of similar age/status. Informal language but respectful tone.",
        "respectful": "Respectful/Polite: Standard polite speech, used with elders, teachers, strangers, or in formal social settings. Uses polite forms, avoids slang.",
        "formal": "Humble/Very Formal: Extra-deferential, used in business, official, or ceremonial settings. Includes set phrases, humble speech, and avoids direct personal references.",
        "distant": "Distant/Neutral: Emotionally detached or objective, used in news reports, legal documents, or academic writing. Avoids pronouns, idioms, and contractions; emphasizes clarity and formality."
    }
    PROFICIENCY_LEVELS = {
        'beginner': "Malayalam: Use extremely simple, short sentences. Stick to basic grammar and common words only.",
        'elementary': "Malayalam: Use simple, clear sentences. Introduce basic particles and common expressions.",
        'intermediate': "Malayalam: Use moderately complex sentences, introduce some idioms, and use natural spoken forms.",
        'advanced': "Malayalam: Use complex grammar, idiomatic phrases, and natural conversational flow.",
        'fluent': "Malayalam: Use native-level expressions, advanced grammar, and culturally nuanced language."
    }
    def __init__(self, model_name="gemini-2.5-flash", feedback_language="English", log_file="conversation_log.json", level="basic/intermediate fluency"):
        super().__init__("ml", "Malayalam", model_name, feedback_language, log_file)
        self.user_level = level
        self.heritage_language = "Malayalam"

    def _get_grammar_rules(self) -> str:
        return """Malayalam grammar rules:
- Use correct word order: Subject-Object-Verb (SOV).
- Match number agreement between nouns, adjectives, and verbs.
- Avoid direct translation from English that sounds unnatural in Malayalam.
- Use polite forms when appropriate (e.g., ദയവായി, നന്ദി, ക്ഷമിക്കണം).
- Ensure subject-verb agreement in number, gender, and politeness level.
- Use appropriate verb endings for tense, aspect, and honorifics (e.g., ചെയ്യുന്നു, ചെയ്തു, ചെയ്യുമോ, ചെയ്തുവോ).
- Segment compound words accurately; avoid splitting naturally agglutinated words (e.g., പാഠപുസ്തകം, പുസ്തകശാല).
"""

    def _get_cultural_rules(self) -> str:
        return """Malayalam Cultural and Conversational Norms:
- Malayalam conversation often emphasizes respect, humility, and indirectness, especially with elders or strangers.
- Use appropriate forms of address (e.g., ചേട്ടൻ/ചേച്ചി, സാർ, ടീച്ചർ) based on relationship and context.
- Be sensitive to levels of formality: casual forms with friends, polite forms with elders or strangers.
- Use  appropriate expressions when reacting, such as ശരി, അതെ, ഇല്ല, പറ്റില്ല.
- Avoid excessive use of pronouns, especially when referring to oneself or the listener."""

    def get_script_suggestion_example(self) -> str:
        return """സുഖമാണോ? - Sukhamāṇo? - Are you well?
എനിക്ക് മലയാളം സംസാരിക്കാൻ ഇഷ്ടമാണ്. - Enikku malayāḷaṁ sansārikkān iṣṭamāṇu. - I like to speak Malayalam.
നിങ്ങളുടെ പ്രിയപ്പെട്ട ഭക്ഷണം എന്താണ്? - Niṅṅaḷuṭe priyappetta bhakṣaṇaṁ entāṇu? - What is your favorite food?   """

class TamilHeritageTutor(LanguageTutor):
    CLOSENESS_LEVELS = {
        "intimate": "Intimate/Familiar: Highly casual, used with very close friends, romantic partners, or younger siblings. Frequent use of informal expressions, omission of subjects, and relaxed tone.",
        "friendly": "Friendly/Peer: Casual but polite, used with classmates, coworkers, or acquaintances of similar age/status. Allows informal language but keeps a respectful tone.",
        "respectful": "Respectful/Polite: Standard polite speech, used with elders, teachers, strangers, or in formal social settings. Uses polite forms, avoids slang.",
        "formal": "Humble/Very Formal: Extra-deferential, used in business, official, or ceremonial settings. Includes set phrases, humble speech, and avoids direct personal references.",
        "distant": "Distant/Neutral: Emotionally detached or objective, used in news reports, legal documents, or academic writing. Avoids pronouns, idioms, and contractions; emphasizes clarity and formality."
    }

    PROFICIENCY_LEVELS = {
        'beginner': "Tamil: Use extremely simple, short sentences. Stick to basic grammar and common words only.",
        'elementary': "Tamil: Use simple, clear sentences. Introduce basic particles and common expressions.",
        'intermediate': "Tamil: Use moderately complex sentences, introduce some idioms, and use natural spoken forms.",
        'advanced': "Tamil: Use complex grammar, idiomatic phrases, and natural conversational flow.",
        'fluent': "Tamil: Use native-level expressions, advanced grammar, and culturally nuanced language."
    }

    def __init__(self, model_name="gemini-2.5-flash", feedback_language="English", log_file="conversation_log.json", level="basic/intermediate fluency"):
        super().__init__("ta", "Tamil", model_name, feedback_language, log_file)
        self.user_level = level
        self.heritage_language = "Tamil"

    def _get_grammar_rules(self) -> str:
        return """Tamil grammar rules:
- Use correct word order: Subject-Object-Verb (SOV).
- Use appropriate postpositions (e.g., இல், க்கு, உடன்) instead of prepositions.
- Match gender and number agreement between nouns, adjectives, and verbs.
- Use correct verb conjugations for tense, aspect, and politeness.
- Avoid direct translation from English that sounds unnatural in Tamil.
- Use natural sentence-final forms and avoid redundant subjects.
- Avoid unnecessary interjections unless they serve a clear conversational or emotional purpose.
- Use polite forms when appropriate (e.g., தயவு செய்து, நன்றி, சற்று)."""

    def _get_cultural_rules(self) -> str:
        return """Tamil Cultural and Conversational Norms:
- Tamil conversation often emphasizes respect, humility, and indirectness, especially with elders or strangers.
- Use appropriate forms of address (e.g., அண்ணா, அக்கா, ஐயா, அம்மா) based on relationship and context.
- Avoid overly assertive or personal questions too early in a conversation.
- Be sensitive to levels of formality: casual forms with friends, polite forms with elders or strangers.
- Mirror the user's politeness level unless correcting overly robotic or textbook responses.
- Use culturally appropriate expressions when reacting, such as சரி, ஆஹா, ஓ, பரவாயில்லை.
- Avoid excessive use of pronouns, especially when referring to oneself or the listener."""

    def get_script_suggestion_example(self) -> str:
        return """நீங்கள் எப்படி இருக்கிறீர்கள்? - Neenga epadi irukkireergal? - How are you?
எனக்கு தமிழ் பேச விருப்பம். - Enakku Tamil pesa viruppam. - I like to speak Tamil.
உங்கள் பிடித்த உணவு என்ன? - Ungal piditha unavu enna? - What is your favorite food?   """

class OdiaHeritageTutor(LanguageTutor):
    CLOSENESS_LEVELS = {
        "intimate": "Intimate/Familiar: Highly casual, used with very close friends, romantic partners, or younger siblings. Frequent use of informal expressions, relaxed tone, and sometimes omission of pronouns.",
        "friendly": "Friendly/Peer: Casual but polite, used with classmates, coworkers, or acquaintances of similar age/status. Informal language but respectful tone.",
        "respectful": "Respectful/Polite: Standard polite speech, used with elders, teachers, strangers, or in formal social settings. Uses polite forms, avoids slang.",
        "formal": "Humble/Very Formal: Extra-deferential, used in business, official, or ceremonial settings. Includes set phrases, humble speech, and avoids direct personal references.",
        "distant": "Distant/Neutral: Emotionally detached or objective, used in news reports, legal documents, or academic writing. Avoids pronouns, idioms, and contractions; emphasizes clarity and formality."
    }
    PROFICIENCY_LEVELS = {
        'beginner': "Odia: Use extremely simple, short sentences. Stick to basic grammar and common words only.",
        'elementary': "Odia: Use simple, clear sentences. Introduce basic particles and common expressions.",
        'intermediate': "Odia: Use moderately complex sentences, introduce some idioms, and use natural spoken forms.",
        'advanced': "Odia: Use complex grammar, idiomatic phrases, and natural conversational flow.",
        'fluent': "Odia: Use native-level expressions, advanced grammar, and culturally nuanced language."
    }
    def __init__(self, model_name="gemini-2.5-flash", feedback_language="English", log_file="conversation_log.json", level="basic/intermediate fluency"):
        super().__init__("or", "Odia", model_name, feedback_language, log_file)
        self.user_level = level
        self.heritage_language = "Odia"

    def _get_grammar_rules(self) -> str:
        return """Odia grammar rules:
- Use correct word order: Subject-Object-Verb (SOV).
- Use appropriate postpositions (e.g., ରେ, କୁ, ପାଇଁ) instead of prepositions.
- Match number agreement between nouns, adjectives, and verbs.
- Use correct verb conjugations for tense, aspect, and politeness.
- Avoid direct translation from English that sounds unnatural in Odia.
- Use natural sentence-final forms and avoid redundant subjects.
- Avoid unnecessary interjections unless they serve a clear conversational or emotional purpose.
- Use polite forms when appropriate (e.g., ଦୟାକରି, ଧନ୍ୟବାଦ, କ୍ଷମାକରିବେ).
- Odia is generally gender-neutral in pronouns ("ତୁମେ" for informal 'you', "ଆପଣ" for polite/respectful 'you'), but clarify when gendered forms are used (e.g., for third-person pronouns or verbs). Explain these distinctions to the learner when relevant.
- Ensure subject-verb agreement in number, gender, and politeness level.
- Use appropriate verb endings for tense, aspect, and honorifics (e.g., କରୁଛି, କରିଛି, କରିବେ, କରିଲେ).
- Segment compound words accurately; avoid splitting naturally agglutinated words (e.g., ଗୃହପାଠ, ପୁସ୍ତକାଳୟ)."""

    def _get_cultural_rules(self) -> str:
        return """Odia Cultural and Conversational Norms:
- Odia conversation often emphasizes respect, humility, and indirectness, especially with elders or strangers.
- Use appropriate forms of address (e.g., ଭାଇ, ଭଉଣୀ, ସାର, ମାର) based on relationship and context.
- Avoid overly assertive or personal questions too early in a conversation.
- Be sensitive to levels of formality: casual forms with friends, polite forms with elders or strangers.
- Use culturally appropriate expressions when reacting, such as ଠିକ୍ ଅଛି, ହଁ, ନା, ଚାଲିବ, ଭଲ.
- Avoid excessive use of pronouns, especially when referring to oneself or the listener.
- Avoid direct refusals; use polite, indirect language when declining or disagreeing.
- Relate the form used to the user's {self.user_closeness} closeness level."""

    def get_explanation_rules(self) -> str:
        return """Odia explanation rules:
- Always explain the form of 'you' (and 'your') used in the response (e.g., 'ତୁମେ', 'ଆପଣ', 'ତୁମର', 'ଆପଣଙ୍କ').
- State whether it is polite/respectful, informal, or intimate, and for which situations or relationships it is used (e.g., elders, friends, children).
- Briefly show how the form would change for masculine/feminine, singular/plural, and for different closeness levels. Give examples: e.g., 'ଆପଣଙ୍କ' (polite/respectful), 'ତୁମର' (informal/singular).
- Relate the form used to the user's {self.user_closeness} closeness level.
- If a gendered or informal form is used, explain the social and grammatical implications.
- When relevant, briefly explain the masculine and feminine forms for third-person pronouns/verbs and when each is used.
- Do not reference the AI, tutor, or learner in your explanation. Just describe the language and its usage neutrally, as if explaining to any interested person."""

    def get_script_suggestion_example(self) -> str:
        return """କେମିତି ଅଛ? - Kemiti achha? - How are you?
ମୁଁ ଓଡ଼ିଆ କଥା ହେବାକୁ ଭଲ ପାଏ। - Mu Odia katha hebaku bhal pae. - I like to speak Odia.
ତୁମର ପ୍ରିୟ ଖାଦ୍ୟ କ'ଣ? - Tumara priya khadya ka'na? - What is your favorite food?   """

class SpanishHeritageTutor(LanguageTutor):
    CLOSENESS_LEVELS = {
        "intimate": "Intimate/Familiar: Highly casual, used with very close friends, romantic partners, or younger siblings. Frequent use of 'tú' or 'vos', informal expressions, and affectionate diminutives.",
        "friendly": "Friendly/Peer: Casual but polite, used with classmates, coworkers, or acquaintances of similar age/status. Uses 'tú' or 'vos' depending on region, informal but respectful tone.",
        "respectful": "Respectful/Polite: Standard polite speech, used with elders, teachers, strangers, or in formal social settings. Uses 'usted', full grammar, and avoids slang.",
        "formal": "Humble/Very Formal: Extra-deferential, used in business, official, or ceremonial settings. Includes set phrases, humble speech, and avoids direct personal references.",
        "distant": "Distant/Neutral: Emotionally detached or objective, used in news reports, legal documents, or academic writing. Avoids pronouns, idioms, and contractions; emphasizes clarity and formality."
    }
    PROFICIENCY_LEVELS = {
        'beginner': "Spanish: Use extremely simple, short sentences. Stick to basic grammar and common words only.",
        'elementary': "Spanish: Use simple, clear sentences. Introduce basic particles and common expressions.",
        'intermediate': "Spanish: Use moderately complex sentences, introduce some idioms, and use natural spoken forms.",
        'advanced': "Spanish: Use complex grammar, idiomatic phrases, and natural conversational flow.",
        'fluent': "Spanish: Use native-level expressions, advanced grammar, and culturally nuanced language."
    }
    def __init__(self, model_name="gemini-2.5-flash", feedback_language="English", log_file="conversation_log.json", level="basic/intermediate fluency"):
        super().__init__("es", "Spanish", model_name, feedback_language, log_file)
        self.user_level = level
        self.heritage_language = "Spanish"

    def _get_grammar_rules(self) -> str:
        return """Spanish grammar rules:
"""

    def _get_cultural_rules(self) -> str:
        return """"""

    def get_explanation_rules(self) -> str:
        return """."""

    def get_script_suggestion_example(self) -> str:
        return """¿Cómo estás? - ¿Cómo estás? - How are you?
Me gusta hablar español. - Me gusta hablar español. - I like to speak Spanish.
¿Cuál es tu comida favorita? - ¿Cuál es tu comida favorita? - What is your favorite food?   """

class FrenchHeritageTutor(LanguageTutor):
    def __init__(self, model_name="gemini-2.5-flash", feedback_language="English", log_file="conversation_log.json", level="basic/intermediate fluency"):
        super().__init__("fr", "French", model_name, feedback_language, log_file)
        self.user_level = level
        self.heritage_language = "French"

    def get_script_suggestion_example(self) -> str:
        return """Comment ça va ? - Komɑ̃ sa va ? - How are you?
J'aime parler français. - ʒɛm paʁle fʁɑ̃sɛ. - I like to speak French.
Quel est ton plat préféré ? - kɛl ɛ tɔ̃ pla pʁefeʁe ? - What is your favorite dish?   """ 

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
    elif language_code == 'ja':  # Japanese
        tutor = JapaneseHeritageTutor(level=f"{user_level} fluency")
        tutor.user_level = user_level
        tutor.user_topics = user_topics
        return tutor
    elif language_code == 'ko':  # Korean
        tutor = KoreanHeritageTutor(level=f"{user_level} fluency")
        tutor.user_level = user_level
        tutor.user_topics = user_topics
        return tutor
    elif language_code == 'zh':  # Mandarin Chinese
        tutor = MandarinChineseHeritageTutor(level=f"{user_level} fluency")
        tutor.user_level = user_level
        tutor.user_topics = user_topics
        return tutor
    elif language_code == 'hi':  # Hindi
        tutor = HindiHeritageTutor(level=f"{user_level} fluency")
        tutor.user_level = user_level
        tutor.user_topics = user_topics
        return tutor
    elif language_code == 'ta':  # Tamil
        tutor = TamilHeritageTutor(level=f"{user_level} fluency")
        tutor.user_level = user_level
        tutor.user_topics = user_topics
        return tutor
    elif language_code == 'ml':  # Malayalam
        tutor = MalayalamHeritageTutor(level=f"{user_level} fluency")
        tutor.user_level = user_level
        tutor.user_topics = user_topics
        return tutor
    elif language_code == 'or':  # Odia
        tutor = OdiaHeritageTutor(level=f"{user_level} fluency")
        tutor.user_level = user_level
        tutor.user_topics = user_topics
        return tutor
    elif language_code == 'es':  # Spanish
        tutor = SpanishHeritageTutor(level=f"{user_level} fluency")
        tutor.user_level = user_level
        tutor.user_topics = user_topics
        return tutor
    elif language_code == 'fr':  # French
        tutor = FrenchHeritageTutor(level=f"{user_level} fluency")
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
def get_conversational_response(transcription: str, chat_history: List[Dict], language: str = 'en', user_level: str = 'beginner', user_topics: List[str] = None, formality: str = 'friendly', feedback_language: str = 'en', user_goals: List[str] = None) -> str:
    """Get conversational response using separate Gemini call."""
    if user_topics is None:
        user_topics = []
    if user_goals is None:
        user_goals = []
    
    # Get or create tutor instance
    tutor_key = f"{language}_{user_level}_{','.join(sorted(user_topics))}"
    if tutor_key not in _tutor_instances:
        _tutor_instances[tutor_key] = create_tutor(language, user_level, user_topics)
    
    tutor = _tutor_instances[tutor_key]
    
    # Update tutor with current context
    tutor.user_level = user_level
    tutor.user_topics = user_topics
    tutor.user_goals = user_goals
    tutor.user_closeness = formality
    tutor.feedback_language = feedback_language
    
    # Build context from chat history
    context = "\n".join([f"{msg['sender']}: {msg['text']}" for msg in chat_history[-4:]]) if chat_history else ""
    
    # Make separate Gemini call for conversation
    return tutor.get_conversational_response(transcription, context)

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
    tutor.feedback_language = feedback_language
    
    # Build context from chat history
    context = "\n".join([f"{msg['sender']}: {msg['text']}" for msg in chat_history[-4:]]) if chat_history else ""
    
    # Make separate Gemini call for feedback
    return tutor.get_detailed_feedback(recognized_text, context)

def get_text_suggestions(chat_history: List[Dict], language: str = 'en', user_level: str = 'beginner', user_topics: List[str] = None, formality: str = 'friendly', feedback_language: str = 'en', user_goals: List[str] = None) -> list:
    """Get text suggestions using separate Gemini call."""
    if user_topics is None:
        user_topics = []
    if user_goals is None:
        user_goals = []
    
    # Get or create tutor instance
    tutor_key = f"{language}_{user_level}_{','.join(sorted(user_topics))}"
    if tutor_key not in _tutor_instances:
        _tutor_instances[tutor_key] = create_tutor(language, user_level, user_topics)
    
    tutor = _tutor_instances[tutor_key]
    
    # Update tutor with current context
    tutor.user_level = user_level
    tutor.user_topics = user_topics
    tutor.user_goals = user_goals
    tutor.user_closeness = formality
    tutor.feedback_language = feedback_language
    
    # Build context from chat history
    context = "\n".join([f"{msg['sender']}: {msg['text']}" for msg in chat_history[-4:]]) if chat_history else ""
    
    # Make separate Gemini call for suggestions
    return tutor.get_suggestions(context)

def get_short_feedback(user_input: str, context: str = "", language: str = 'en', user_level: str = 'beginner', user_topics: list = None, feedback_language: str = 'en', user_goals: list = None) -> str:
    """Generate a short, conversational feedback about grammar/style."""
    if not GOOGLE_AI_AVAILABLE:
        return "Short feedback ran (no Gemini API key configured)"
    if user_topics is None:
        user_topics = []
    if user_goals is None:
        user_goals = []
    
    goals_guidance = ""
    if user_goals and len(user_goals) > 0:
        goals_list = ', '.join(user_goals)
        goals_guidance = f"\nUser's learning goals: {goals_list}. Focus your feedback on helping them achieve these goals."
    
    prompt = (
        f"You are a friendly language tutor. The user just said: \"{user_input}\".\n"
        f"Context: {context}\n"
        f"User level: {user_level}\n"
        f"Preferred topics: {', '.join(user_topics) if user_topics else 'none'}\n"
        f"{goals_guidance}\n"
        f"Give a very short (1-2 sentences) tip or correction about grammar or style, only if needed. "
        f"If there are no issues, say something encouraging. "
        f"Be brief and natural, like a quick chat comment. "
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

def generate_conversation_summary(chat_history: List[Dict]) -> Dict[str, str]:
    """Generate a title and synopsis for the entire conversation history using Gemini."""
    if not GOOGLE_AI_AVAILABLE:
        return {"title": "[Unavailable]", "synopsis": "[Gemini not available]"}
    
    # Build the full context string
    context = "\n".join([f"{msg['sender']}: {msg['text']}" for msg in chat_history])
    
    prompt = f"""
You are an expert conversation summarizer for a language learning app. Given the full conversation below, generate:
1. A short, descriptive title (max 8 words) that captures the main topic or theme of the conversation.
2. A concise synopsis (2-4 sentences) that summarizes what was discussed, the tone, and any key moments or learning points.

CONVERSATION HISTORY:
{context}

Return your answer in this exact format:
Title: <your title here>
Synopsis: <your synopsis here>
"""
    try:
        model = genai.GenerativeModel("gemini-1.5-flash")
        response = model.generate_content(prompt)
        if response and response.text:
            # Parse the response
            lines = response.text.strip().split("\n")
            title = ""
            synopsis = ""
            for line in lines:
                if line.lower().startswith("title:"):
                    title = line[len("title:"):].strip()
                elif line.lower().startswith("synopsis:"):
                    synopsis = line[len("synopsis:"):].strip()
            if not title or not synopsis:
                # fallback: use the whole response as synopsis
                synopsis = response.text.strip()
            return {"title": title, "synopsis": synopsis}
        else:
            return {"title": "[No response]", "synopsis": "[No response from Gemini]"}
    except Exception as e:
        print(f"Error generating conversation summary: {e}")
        return {"title": "[Error]", "synopsis": str(e)}