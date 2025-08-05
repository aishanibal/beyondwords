#!/usr/bin/env python3
"""
Simplified Google Cloud TTS using existing Google AI API key
No service account required!
"""

import os
import requests
import base64
from typing import Optional

class SimpleGoogleCloudTTS:
    """Simple Google Cloud TTS using REST API with existing API key"""

    # Map ISO language codes to Google Cloud TTS language codes
    LANGUAGE_VOICES = {
        'en': 'en-US',          # English ✅
        'es': 'es-ES',          # Spanish ✅
        'fr': 'fr-FR',          # French ✅
        'zh': 'zh-CN',          # Mandarin Chinese ✅
        'ja': 'ja-JP',          # Japanese ✅
        'ko': 'ko-KR',          # Korean ✅
        'tl': 'en-US',          # Tagalog (using English) ⚠️
        'hi': 'hi-IN',          # Hindi ✅
        'ml': 'ml-IN',          # Malayalam ✅
        'ta': 'ta-IN',          # Tamil ✅
        'or': 'en-US',          # Odia (using English) ⚠️
    }

    def __init__(self, api_key: Optional[str] = None):
        """
        Initialize the TTS synthesizer.

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
        
        print(f"✅ Simple Google Cloud TTS initialized with API key prefix {self.api_key[:8]}...")

    def get_language_code(self, language_code: str) -> str:
        """Return the appropriate Google Cloud language code"""
        return self.LANGUAGE_VOICES.get(language_code.lower(), 'en-US')

    def synthesize_speech(
        self,
        text: str,
        language_code: str = 'en',
        output_path: str = "tts_output/google_cloud_response.mp3"
    ) -> Optional[str]:
        """
        Generate speech audio from text using Google Cloud TTS REST API.

        Returns the path to the saved file, or None on error.
        """
        # Ensure output directory exists
        output_dir = os.path.dirname(output_path)
        if output_dir:
            os.makedirs(output_dir, exist_ok=True)
        
        google_language = self.get_language_code(language_code)
        
        print(f"🎤 Simple Google Cloud TTS: Using language '{google_language}' for '{language_code}'")
        print(f"💰 Cost: ~${len(text) * 0.004 / 1000:.4f}")

        try:
            # Google Cloud TTS REST API endpoint
            url = f"https://texttospeech.googleapis.com/v1/text:synthesize?key={self.api_key}"
            
            # Request payload
            payload = {
                "input": {"text": text},
                "voice": {
                    "languageCode": google_language,
                    "ssmlGender": "NEUTRAL"
                },
                "audioConfig": {
                    "audioEncoding": "MP3"
                }
            }
            
            # Make the request
            response = requests.post(url, json=payload)
            
            if response.status_code == 200:
                # Decode the audio content
                audio_content = base64.b64decode(response.json()['audioContent'])
                
                # Write to file
                with open(output_path, "wb") as f:
                    f.write(audio_content)
                
                print(f"✅ Simple Google Cloud TTS output saved to: {output_path}")
                return output_path
            else:
                print(f"❌ Google Cloud TTS API error: {response.status_code} - {response.text}")
                return None
                
        except Exception as e:
            print(f"❌ Error in Simple Google Cloud TTS synthesis: {e}")
            return None


def synthesize_speech(
    text: str,
    language_code: str = 'en',
    output_path: str = "tts_output/google_cloud_response.mp3"
) -> Optional[str]:
    """Convenience wrapper around SimpleGoogleCloudTTS"""
    try:
        synth = SimpleGoogleCloudTTS()
        return synth.synthesize_speech(text, language_code, output_path)
    except Exception as e:
        print(f"❌ Error initializing or running Simple Google Cloud TTS: {e}")
        return None


if __name__ == "__main__":
    # Test the Simple Google Cloud TTS
    test_text = "Hello world! This is a test of Simple Google Cloud Text-to-Speech."
    result = synthesize_speech(test_text, 'en', 'test_simple_google_cloud_tts.mp3')
    if result:
        print(f"✅ Test successful: {result}")
    else:
        print("❌ Test failed") 