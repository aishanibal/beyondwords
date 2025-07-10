import requests
import json
from typing import List, Dict, Optional

class OllamaClient:
    def __init__(self, base_url: str = "http://localhost:11434"):
        self.base_url = base_url
        self.model = "llama3.2"
    
    def health_check(self) -> bool:
        """Check if Ollama is running and ready"""
        try:
            response = requests.get(f"{self.base_url}/api/tags", timeout=3)
            return response.status_code == 200
        except Exception as e:
            print(f"Ollama health check failed: {e}")
            return False
    
    def generate_conversational_response(self, 
                                       transcription: str, 
                                       chat_history: List[Dict],
                                       language: str = 'en',
                                       user_level: str = 'beginner',
                                       user_topics: List[str] = None) -> str:
        """Generate conversational response for the main chat flow"""
        try:
            # Handle default user_topics
            if user_topics is None:
                user_topics = []
            
            # Format chat history for context (last 4 messages)
            chat_context = ""
            if chat_history:
                recent_messages = chat_history[-4:]  # Last 4 messages
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
            
            response = requests.post(
                f"{self.base_url}/api/generate",
                json={
                    "model": self.model,
                    "prompt": prompt,
                    "stream": False
                },
                timeout=10
            )
            
            if response.status_code == 200:
                print("Running 200 code")
                return response.json().get("response", "Thanks for sharing that!")
            else:
                print(f"Ollama conversational response error: {response.status_code}")
                return "Thanks for your speech! Keep practicing."
                
        except Exception as e:
            print(f"Conversational response generation error: {e}")
            return "Thanks for your speech! Keep practicing."




            
    
    def generate_detailed_feedback(self, 
                                 phoneme_analysis: str, 
                                 reference_text: str, 
                                 recognized_text: str, 
                                 chat_history: List[Dict],
                                 language: str = 'en',
                                 user_level: str = 'beginner',
                                 user_topics: List[str] = None) -> str:
        """Generate detailed feedback using phoneme analysis and conversation context"""
        try:
            # Handle default user_topics
            if user_topics is None:
                user_topics = []
            
            # Create conversation context (last 6 messages)
            conversation_context = ""
            if chat_history:
                recent_messages = chat_history[-6:]  # Last 6 messages
                conversation_context = "\n".join([f"{msg['sender']}: {msg['text']}" for msg in recent_messages])
            
            # Language-specific instructions
            language_instruction = ""
            if language == 'es':
                language_instruction = "Provide feedback ONLY in Spanish. Do NOT provide any English translation or explanation."
            elif language == 'hi':
                language_instruction = "Provide feedback ONLY in Hindi. Do NOT provide any English translation or explanation."
            elif language == 'ja':
                language_instruction = "Provide feedback ONLY in Japanese. Do NOT provide any English translation or explanation."
            
            # User context for personalized feedback
            level_context = ""
            if user_level == 'heritage':
                level_context = "This is a heritage speaker who understands the language but needs confidence and practice speaking. Focus on pronunciation confidence and natural expression."
            elif user_level == 'beginner':
                level_context = "This is a beginner learner. Focus on basic pronunciation, simple grammar, and building confidence. Be very encouraging."
            elif user_level == 'intermediate':
                level_context = "This is an intermediate learner. You can address more complex grammar patterns and pronunciation nuances."
            elif user_level == 'advanced':
                level_context = "This is an advanced learner. Focus on subtle pronunciation differences, complex grammar, and native-like expression."
            
            topics_context = ""
            if user_topics:
                topics_context = f"Their preferred topics to discuss include: {', '.join(user_topics)}. Consider incorporating these topics into your feedback when relevant."
            
            prompt = f"""You are an expert speech coach providing detailed analysis and feedback.

{language_instruction}

USER CONTEXT:
{level_context}
{topics_context}

PHONEME ANALYSIS RESULTS:
{phoneme_analysis}

REFERENCE (Expected): {reference_text}
RECOGNIZED (Actual): {recognized_text}

CONVERSATION CONTEXT:
{conversation_context}

Based on this phoneme-level analysis, user context, and conversation, provide a comprehensive speech analysis report that includes:

1. List all mismatched phonemes in the most recent speech by comparing reference vs recognized text
2. Using the reference text, MOST IMPORTANT - point out grammar and sentence structure errors
3. Based on the stresses and hesitations, point out the most important words to work on
4. Display the mismatched phonemes in a list

Keep the tone encouraging and professional. Format with clear sections and bullet points. Tailor advice to their experience level and preferred discussion topics."""
            
            response = requests.post(
                f"{self.base_url}/api/generate",
                json={
                    "model": self.model,
                    "prompt": prompt,
                    "stream": False
                },
                timeout=60
            )
            
            if response.status_code == 200:
                return response.json().get("response", "Analysis completed.")
            else:
                print(f"Ollama detailed feedback error: {response.status_code}")
                return "Error generating detailed feedback."
                
        except Exception as e:
            print(f"Detailed feedback generation error: {e}")
            return "Error generating detailed feedback."
    
    def generate_text_suggestions(self, 
                                chat_history: List[Dict],
                                language: str = 'en',
                                user_level: str = 'beginner',
                                user_topics: List[str] = None) -> List[Dict]:
        """Generate 3 contextual text suggestions for what to say next"""
        try:
            # Handle default user_topics
            if user_topics is None:
                user_topics = []
            
            # Create conversation context (last 4 messages)
            conversation_context = ""
            if chat_history:
                recent_messages = chat_history[-4:]  # Last 4 messages
                conversation_context = "\n".join([f"{msg['sender']}: {msg['text']}" for msg in recent_messages])
            
            # Language-specific instructions
            language_instruction = ""
            if language == 'es':
                language_instruction = "Provide suggestions ONLY in Spanish. Include English translations."
            elif language == 'hi':
                language_instruction = "Provide suggestions ONLY in Hindi. Include English translations."
            elif language == 'ja':
                language_instruction = "Provide suggestions ONLY in Japanese. Include English translations."
            else:
                language_instruction = "Provide suggestions in English only."
            
            # User context for personalized suggestions
            level_context = ""
            if user_level == 'heritage':
                level_context = "User is a heritage speaker who understands but needs confidence speaking. Suggest natural, conversational phrases they might use with family."
            elif user_level == 'beginner':
                level_context = "User is a beginner learner. Suggest simple, basic phrases and vocabulary."
            elif user_level == 'intermediate':
                level_context = "User is an intermediate learner. Suggest moderately complex phrases and common expressions."
            elif user_level == 'advanced':
                level_context = "User is an advanced learner. Suggest complex phrases, idioms, and nuanced expressions."
            
            topics_context = ""
            if user_topics:
                topics_context = f"User's preferred discussion topics: {', '.join(user_topics)}. Tailor suggestions to incorporate these topics."
            
            prompt = f"""You are a language learning assistant. Based on the conversation context, provide exactly 3 suggestions for what the user could say next.

{level_context}
{topics_context}

CONVERSATION CONTEXT:
{conversation_context}

{language_instruction}

IMPORTANT: Return your response as a JSON array with exactly 3 objects, each containing:
- "text": the suggested phrase in the target language
- "translation": the English translation (if target language is not English)
- "difficulty": "easy", "medium", or "hard"

Example format:
[
  {{"text": "¿Cómo ha estado tu día?", "translation": "How has your day been?", "difficulty": "medium"}},
  {{"text": "Me alegra escuchar eso", "translation": "I'm glad to hear that", "difficulty": "medium"}},
  {{"text": "¿Qué planes tienes para mañana?", "translation": "What plans do you have for tomorrow?", "difficulty": "hard"}}
]

Make sure suggestions are contextually appropriate and match the user's level and preferred topics."""
            
            response = requests.post(
                f"{self.base_url}/api/generate",
                json={
                    "model": self.model,
                    "prompt": prompt,
                    "stream": False
                },
                timeout=15
            )
            
            if response.status_code == 200:
                response_text = response.json().get("response", "[]")
                try:
                    # Parse JSON response
                    suggestions = json.loads(response_text)
                    if isinstance(suggestions, list) and len(suggestions) >= 3:
                        return suggestions[:3]  # Return first 3 suggestions
                    else:
                        # Fallback if JSON parsing fails
                        return self._generate_fallback_suggestions(language, user_level)
                except json.JSONDecodeError:
                    print(f"Failed to parse JSON response: {response_text}")
                    return self._generate_fallback_suggestions(language, user_level)
            else:
                print(f"Ollama text suggestions error: {response.status_code}")
                return self._generate_fallback_suggestions(language, user_level)
                
        except Exception as e:
            print(f"Text suggestions generation error: {e}")
            return self._generate_fallback_suggestions(language, user_level)
    
    def _generate_fallback_suggestions(self, language: str, user_level: str) -> List[Dict]:
        """Generate fallback suggestions when Ollama fails"""
        fallbacks = {
            'es': [
                {"text": "¿Cómo estás?", "translation": "How are you?", "difficulty": "easy"},
                {"text": "Me gusta mucho", "translation": "I really like it", "difficulty": "easy"},
                {"text": "¿Qué piensas?", "translation": "What do you think?", "difficulty": "medium"}
            ],
            'hi': [
                {"text": "आप कैसे हैं?", "translation": "How are you?", "difficulty": "easy"},
                {"text": "मुझे यह पसंद है", "translation": "I like this", "difficulty": "easy"},
                {"text": "आपका क्या विचार है?", "translation": "What is your opinion?", "difficulty": "medium"}
            ],
            'ja': [
                {"text": "元気ですか？", "translation": "How are you?", "difficulty": "easy"},
                {"text": "とても好きです", "translation": "I really like it", "difficulty": "easy"},
                {"text": "どう思いますか？", "translation": "What do you think?", "difficulty": "medium"}
            ]
        }
        
        return fallbacks.get(language, [
            {"text": "How are you?", "translation": "How are you?", "difficulty": "easy"},
            {"text": "That's interesting", "translation": "That's interesting", "difficulty": "easy"},
            {"text": "What do you think?", "translation": "What do you think?", "difficulty": "medium"}
        ])

    def translate_text(self, text: str, source_language: str = 'auto', target_language: str = 'en', breakdown: bool = False) -> Dict:
        """Translate text with optional detailed breakdown"""
        try:
            # Auto-detect source language if not specified
            if source_language == 'auto':
                # Simple heuristic for language detection
                if any(char in text for char in 'áéíóúñ¿¡'):
                    source_language = 'es'
                elif any(char in text for char in 'आईउएऑकगचजदपबमयरलवशषसह'):
                    source_language = 'hi'
                elif any(char in text for char in 'あいうえおかきくけこさしすせそたちつてとなにぬねのはひふへほまみむめもやゆよらりるれろわをん'):
                    source_language = 'ja'
                else:
                    source_language = 'en'
            
            # Language names mapping
            language_names = {
                'en': 'English',
                'es': 'Spanish',
                'hi': 'Hindi',
                'ja': 'Japanese'
            }
            
            source_lang_name = language_names.get(source_language, source_language)
            target_lang_name = language_names.get(target_language, target_language)
            
            if breakdown:
                # Detailed breakdown translation
                prompt = f"""You are a professional translator and language teacher. Translate the following text from {source_lang_name} to {target_lang_name} and provide a detailed breakdown.

Text to translate: "{text}"

Provide your response in the following JSON format:
{{
  "translation": "The direct translation",
  "breakdown": {{
    "word_by_word": [
      {{"original": "word1", "translation": "word1_translation", "part_of_speech": "noun/verb/etc"}},
      {{"original": "word2", "translation": "word2_translation", "part_of_speech": "noun/verb/etc"}}
    ],
    "grammar_notes": "Explanation of grammar structures used",
    "cultural_notes": "Any cultural context or nuances",
    "literal_translation": "Word-for-word literal translation if different from natural translation"
  }}
}}

Make sure to provide accurate translations and helpful explanations for language learners."""
            else:
                # Simple translation
                prompt = f"""Translate the following text from {source_lang_name} to {target_lang_name}. Provide only the translation, nothing else.

Text to translate: "{text}"

Translation:"""
            
            response = requests.post(
                f"{self.base_url}/api/generate",
                json={
                    "model": self.model,
                    "prompt": prompt,
                    "stream": False
                },
                timeout=15
            )
            
            if response.status_code == 200:
                response_text = response.json().get("response", "")
                
                if breakdown:
                    try:
                        # Try to parse JSON response for breakdown
                        translation_data = json.loads(response_text)
                        return {
                            "translation": translation_data.get("translation", ""),
                            "breakdown": translation_data.get("breakdown", {}),
                            "source_language": source_language,
                            "target_language": target_language,
                            "has_breakdown": True
                        }
                    except json.JSONDecodeError:
                        # Fallback if JSON parsing fails
                        return {
                            "translation": response_text.strip(),
                            "breakdown": {},
                            "source_language": source_language,
                            "target_language": target_language,
                            "has_breakdown": False
                        }
                else:
                    # Simple translation
                    return {
                        "translation": response_text.strip(),
                        "source_language": source_language,
                        "target_language": target_language,
                        "has_breakdown": False
                    }
            else:
                print(f"Ollama translation error: {response.status_code}")
                return {
                    "translation": f"Error: Could not translate text",
                    "source_language": source_language,
                    "target_language": target_language,
                    "has_breakdown": False
                }
                
        except Exception as e:
            print(f"Translation error: {e}")
            return {
                "translation": f"Error: Translation failed",
                "source_language": source_language,
                "target_language": target_language,
                "has_breakdown": False
            }

# Global instance
ollama_client = OllamaClient()

# Convenience functions
def get_conversational_response(transcription: str, chat_history: List[Dict], language: str = 'en', user_level: str = 'beginner', user_topics: List[str] = None) -> str:
    """Get conversational response for main chat"""
    return ollama_client.generate_conversational_response(transcription, chat_history, language, user_level, user_topics)

def get_detailed_feedback(phoneme_analysis: str, reference_text: str, recognized_text: str, chat_history: List[Dict], language: str = 'en', user_level: str = 'beginner', user_topics: List[str] = None) -> str:
    """Get detailed feedback with phoneme analysis"""
    return ollama_client.generate_detailed_feedback(phoneme_analysis, reference_text, recognized_text, chat_history, language, user_level, user_topics)

def get_text_suggestions(chat_history: List[Dict], language: str = 'en', user_level: str = 'beginner', user_topics: List[str] = None) -> List[Dict]:
    """Get 3 contextual text suggestions for what to say next"""
    return ollama_client.generate_text_suggestions(chat_history, language, user_level, user_topics)

def get_translation(text: str, source_language: str = 'auto', target_language: str = 'en', breakdown: bool = False) -> Dict:
    """Get translation with optional detailed breakdown"""
    return ollama_client.translate_text(text, source_language, target_language, breakdown)

def is_ollama_ready() -> bool:
    """Check if Ollama is ready"""
    return ollama_client.health_check() 