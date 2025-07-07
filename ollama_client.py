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
                                       language: str = 'en') -> str:
        """Generate conversational response for the main chat flow"""
        try:
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
            
            prompt = f"""You are a helpful speech coach having a conversation. 

Previous conversation:
{chat_context}

The user just said: "{transcription}"

{language_instruction}

Respond naturally as if you're having a conversation. Keep it friendly and encouraging, around 15-25 words. Don't be too formal - just chat naturally! Try to keep the conversation going."""
            
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
                                 language: str = 'en') -> str:
        """Generate detailed feedback using phoneme analysis and conversation context"""
        try:
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
            
            prompt = f"""You are an expert speech coach providing detailed pronunciation analysis.

{language_instruction}

IMPORTANT: Keep your response to exactly 20 words or less. Do not exceed this limit.

PHONEME ANALYSIS RESULTS:
{phoneme_analysis}

REFERENCE (Expected): {reference_text}
RECOGNIZED (Actual): {recognized_text}

CONVERSATION CONTEXT:
{conversation_context}

Based on this phoneme-level analysis and conversation context, provide:
1. Using the reference text, MOST IMPORTANT - point out grammar and sentence structure errors
2. In context with the words, which ones are the most important to work on based on the phonemes missed
3. Based on the stresses and hesitations, point out the most important words to work on
4. Just display the mismatched phonemes in a list

Keep the tone encouraging and actionable, building on the conversation you've been having.

REMEMBER: Maximum 20 words total."""
            
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

# Global instance
ollama_client = OllamaClient()

# Convenience functions
def get_conversational_response(transcription: str, chat_history: List[Dict], language: str = 'en') -> str:
    """Get conversational response for main chat"""
    return ollama_client.generate_conversational_response(transcription, chat_history, language)

def get_detailed_feedback(phoneme_analysis: str, reference_text: str, recognized_text: str, chat_history: List[Dict], language: str = 'en') -> str:
    """Get detailed feedback with phoneme analysis"""
    return ollama_client.generate_detailed_feedback(phoneme_analysis, reference_text, recognized_text, chat_history, language)

def is_ollama_ready() -> bool:
    """Check if Ollama is ready"""
    return ollama_client.health_check() 