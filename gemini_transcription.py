#!/usr/bin/env python3
"""
Gemini Audio Transcription Module
Replaces Whisper with Gemini 2.5 Flash for audio transcription
"""

import os
import base64
import json
import requests
from typing import Optional, Dict, Any

# Load environment variables from .env file
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass  # dotenv is optional, will use system env vars if not available

class GeminiTranscriber:
    """Audio transcription using Gemini 2.5 Flash"""
    
    def __init__(self, api_key: Optional[str] = None):
        """
        Initialize the Gemini transcriber.
        
        Args:
            api_key: Google AI API key. If None, uses environment variables.
        """
        self.api_key = (
            api_key
            or os.getenv('GOOGLE_AI_API_KEY')
            or os.getenv('GEMINI_API_KEY')
            or os.getenv('GOOGLE_API_KEY')
        )
        
        if not self.api_key:
            raise ValueError(
                "No API key found. Set GOOGLE_AI_API_KEY, GEMINI_API_KEY, or GOOGLE_API_KEY."
            )
        
        self.base_url = "https://generativelanguage.googleapis.com/v1beta/models"
        self.model = "gemini-2.0-flash-exp"
        
        print(f"✅ Gemini Transcriber initialized with API key prefix {self.api_key[:8]}...")

    def transcribe_audio(
        self,
        audio_path: str,
        language_code: str = 'en',
        prompt: str = None
    ) -> Optional[str]:
        """
        Transcribe audio using Gemini 2.5 Flash.
        
        Args:
            audio_path: Path to the audio file
            language_code: Language code (e.g., 'en', 'es', 'hi', 'ja', etc.)
            prompt: Optional custom prompt for transcription
            
        Returns:
            Transcribed text or None on error
        """
        try:
            # Read and encode the audio file
            with open(audio_path, "rb") as audio_file:
                audio_content = audio_file.read()
                audio_encoded = base64.b64encode(audio_content).decode('utf-8')
                
            print(f"🔍 [GEMINI] Audio file info: {len(audio_content)} bytes, {audio_path}")

            # Default prompt for transcription
            if not prompt:
                language_names = {
                    'en': 'English',
                    'es': 'Spanish', 
                    'fr': 'French',
                    'zh': 'Chinese',
                    'ja': 'Japanese',
                    'ko': 'Korean',
                    'hi': 'Hindi',
                    'ml': 'Malayalam',
                    'ta': 'Tamil',
                    'or': 'Odia',
                    'tl': 'Tagalog'
                }
                language_name = language_names.get(language_code, 'English')
                prompt = f"Please transcribe this {language_name} audio accurately. Return only the transcribed text without any additional formatting or explanations."

            # Prepare the request payload
            payload = {
                "contents": [{
                    "parts": [
                        {
                            "text": prompt
                        },
                        {
                            "inline_data": {
                                "mime_type": self._get_mime_type(audio_path),
                                "data": audio_encoded
                            }
                        }
                    ]
                }],
                "generation_config": {
                    "temperature": 0.1,
                    "top_p": 0.8,
                    "top_k": 40,
                    "max_output_tokens": 1024
                }
            }

            # Make the request to Gemini API
            url = f"{self.base_url}/{self.model}:generateContent?key={self.api_key}"
            
            response = requests.post(url, json=payload)
            
            if response.status_code == 200:
                result = response.json()
                print(f"🔍 [GEMINI] API Response: {result}")
                
                if 'candidates' in result and len(result['candidates']) > 0:
                    # Extract the transcribed text
                    transcript = result['candidates'][0]['content']['parts'][0]['text']
                    print(f"✅ Gemini transcription: '{transcript}'")
                    return transcript.strip()
                else:
                    print("❌ No transcription results returned")
                    print(f"🔍 [GEMINI] Full response: {result}")
                    return None
            else:
                print(f"❌ Gemini API error: {response.status_code} - {response.text}")
                return None
                
        except Exception as e:
            print(f"❌ Error in Gemini audio transcription: {e}")
            return None

    def _get_mime_type(self, audio_path: str) -> str:
        """Determine MIME type based on file extension."""
        ext = audio_path.lower().split('.')[-1]
        mime_types = {
            'mp3': 'audio/mpeg',
            'wav': 'audio/wav',
            'm4a': 'audio/mp4',
            'aac': 'audio/aac',
            'ogg': 'audio/ogg',
            'flac': 'audio/flac'
        }
        return mime_types.get(ext, 'audio/mpeg')

    def transcribe_with_analysis(
        self,
        audio_path: str,
        language_code: str = 'en',
        analysis_prompt: str = None
    ) -> Dict[str, Any]:
        """
        Transcribe audio and provide additional analysis.
        
        Args:
            audio_path: Path to the audio file
            language_code: Language code
            analysis_prompt: Optional custom analysis prompt
            
        Returns:
            Dictionary with transcription and analysis
        """
        # First get the transcription
        transcript = self.transcribe_audio(audio_path, language_code)
        
        if not transcript:
            return {"transcript": None, "analysis": None}
        
        # Then analyze the transcription
        if not analysis_prompt:
            analysis_prompt = f"""
            Analyze this {language_code} transcription and provide:
            1. Key topics discussed
            2. Sentiment/tone
            3. Any notable language patterns or errors
            4. Suggestions for improvement (if applicable)
            
            Transcription: {transcript}
            """
        
        try:
            # Make analysis request
            payload = {
                "contents": [{
                    "parts": [{"text": analysis_prompt}]
                }],
                "generation_config": {
                    "temperature": 0.3,
                    "top_p": 0.8,
                    "top_k": 40,
                    "max_output_tokens": 1024
                }
            }
            
            url = f"{self.base_url}/{self.model}:generateContent?key={self.api_key}"
            response = requests.post(url, json=payload)
            
            if response.status_code == 200:
                result = response.json()
                if 'candidates' in result and len(result['candidates']) > 0:
                    analysis = result['candidates'][0]['content']['parts'][0]['text']
                    return {
                        "transcript": transcript,
                        "analysis": analysis.strip()
                    }
            
            return {"transcript": transcript, "analysis": None}
            
        except Exception as e:
            print(f"❌ Error in analysis: {e}")
            return {"transcript": transcript, "analysis": None}


# Global transcriber instance
gemini_transcriber = None

def get_gemini_transcriber() -> GeminiTranscriber:
    """Get or create the global Gemini transcriber instance."""
    global gemini_transcriber
    if gemini_transcriber is None:
        gemini_transcriber = GeminiTranscriber()
    return gemini_transcriber

def transcribe_audio_gemini(audio_path: str, language_code: str = 'en') -> str:
    """
    Convenience function to transcribe audio using Gemini.
    
    Args:
        audio_path: Path to the audio file
        language_code: Language code
        
    Returns:
        Transcribed text or empty string on error
    """
    try:
        transcriber = get_gemini_transcriber()
        result = transcriber.transcribe_audio(audio_path, language_code)
        return result if result else ""
    except Exception as e:
        print(f"Error in Gemini transcription: {e}")
        return ""

def transcribe_audio_with_analysis_gemini(audio_path: str, language_code: str = 'en') -> Dict[str, Any]:
    """
    Convenience function to transcribe audio with analysis using Gemini.
    
    Args:
        audio_path: Path to the audio file
        language_code: Language code
        
    Returns:
        Dictionary with transcript and analysis
    """
    try:
        transcriber = get_gemini_transcriber()
        return transcriber.transcribe_with_analysis(audio_path, language_code)
    except Exception as e:
        print(f"Error in Gemini transcription with analysis: {e}")
        return {"transcript": "", "analysis": ""} 