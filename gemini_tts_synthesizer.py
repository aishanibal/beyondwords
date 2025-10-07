#!/usr/bin/env python3
"""
Text-to-Speech Synthesizer using Gemini TTS via SDK

This module uses the Google GenAI SDK (`google-genai`) to access Gemini TTS.

Requirements:
    pip install --upgrade google-genai

Credentials:
    - API key: set environment variable GOOGLE_AI_API_KEY / GEMINI_API_KEY / GOOGLE_API_KEY.
    - OR Service Account: set GOOGLE_APPLICATION_CREDENTIALS pointing to a JSON key file.

Cloud Setup:
    - Enable "Generative Language API" in your GCP project.
    - Ensure your key or service account has access to generativelanguage.googleapis.com.
"""

import os
import base64
import wave
from typing import Optional

# Require the Google GenAI SDK
try:
    import google.genai as genai
    from google.genai import types
except ImportError:
    raise ImportError(
        "Google GenAI SDK not found. Install it with:\n"
        "    pip install --upgrade google-genai"
    )

class GeminiTTSSynthesizer:
    """Text-to-Speech synthesizer using Gemini TTS via the GenAI SDK"""

    # Map ISO language codes to prebuilt voice names supported by the API
    # Note: Gemini TTS may not support all languages natively
    # Matches frontend LANGUAGES: ['en', 'es', 'fr', 'zh', 'ja', 'ko', 'tl', 'hi', 'ml', 'ta', 'or']
    LANGUAGE_VOICES = {
        'en': 'kore',          # English ✅
        'es': 'sadachbia',     # Spanish ✅
        'fr': 'gacrux',        # French ✅
        'zh': 'rasalgethi',    # Mandarin Chinese ✅
        'ja': 'fenrir',        # Japanese ✅
        'ko': 'charon',        # Korean ✅
        'tl': 'kore',          # Tagalog (using English voice) ⚠️
        'hi': 'sadaltager',    # Hindi ✅
        'ml': 'umbriel',       # Malayalam ✅
        'ta': 'orus',          # Tamil ✅
        'or': 'kore',          # Odia (using English voice) ⚠️
    }

    def __init__(self, api_key: Optional[str] = None):
        """
        Initialize the TTS synthesizer.

        Args:
            api_key: Direct API key. If None, it falls back to env vars or ADC.
        """
        self.api_key = (
            api_key
            or os.getenv('GOOGLE_AI_API_KEY')
            or os.getenv('GEMINI_API_KEY')
            or os.getenv('GOOGLE_API_KEY')
        )
        if self.api_key:
            self.client = genai.Client(api_key=self.api_key)
            print(f"✅ Gemini TTS client initialized with API key prefix {self.api_key[:8]}...")
        elif os.getenv('GOOGLE_APPLICATION_CREDENTIALS'):
            self.client = genai.Client()
            print("✅ Gemini TTS client initialized via Application Default Credentials")
        else:
            raise ValueError(
                "No credentials found. Set GOOGLE_AI_API_KEY or GOOGLE_APPLICATION_CREDENTIALS."
            )

    def get_voice_for_language(self, language_code: str) -> str:
        """Return the appropriate voice name for the given ISO language code"""
        return self.LANGUAGE_VOICES.get(language_code.lower(), 'kore')

    def synthesize_speech(
        self,
        text: str,
        language_code: str = 'en',
        output_path: str = "tts_output/gemini_response.wav"
    ) -> Optional[str]:
        """
        Generate speech audio from text and save to WAV.

        Returns the path to the saved file, or None on error.
        """
        # Ensure output directory exists
        output_dir = os.path.dirname(output_path)
        if output_dir:  # Only create directory if there is one
            os.makedirs(output_dir, exist_ok=True)
        
        voice = self.get_voice_for_language(language_code)
        
        print(f"🎤 Gemini TTS: Using voice '{voice}' for language '{language_code}'")

        try:
            response = self.client.models.generate_content(
                model="gemini-2.5-flash-preview-tts",  # Current available TTS model
                contents=text,  # Just the text, no "Say cheerfully:" prefix
                config=types.GenerateContentConfig(
                    response_modalities=["AUDIO"],
                    speech_config=types.SpeechConfig(
                        voice_config=types.VoiceConfig(
                            prebuilt_voice_config=types.PrebuiltVoiceConfig(
                                voice_name=voice
                            )
                        )
                    )
                )
            )

            # Extract and decode audio bytes
            if not response.candidates or not response.candidates[0].content.parts:
                print("❌ No audio data in response")
                return None
                
            part = response.candidates[0].content.parts[0].inline_data.data
            audio_bytes = base64.b64decode(part) if isinstance(part, str) else part

            # Write a WAV file
            with wave.open(output_path, "wb") as wf:
                wf.setnchannels(1)
                wf.setsampwidth(2)
                wf.setframerate(24000)
                wf.writeframes(audio_bytes)

            print(f"✅ Gemini TTS output saved to: {output_path}")
            return output_path
            
        except Exception as e:
            print(f"❌ Error in Gemini TTS synthesis: {e}")
            return None


def synthesize_speech(
    text: str,
    language_code: str = 'en',
    output_path: str = "tts_output/gemini_response.wav"
) -> Optional[str]:
    """Convenience wrapper around GeminiTTSSynthesizer"""
    try:
        synth = GeminiTTSSynthesizer()
        result = synth.synthesize_speech(text, language_code, output_path)
        if result:
            return result
        else:
            print("❌ Gemini TTS returned None - will use fallback")
            return None
    except Exception as e:
        err = str(e)
        if 'quota' in err.lower() or '429' in err:
            print(f"❌ Quota exceeded: {e}")
        elif 'NoneType' in err:
            print("❌ Empty response from Gemini TTS API - will use fallback")
        else:
            print(f"❌ Error initializing or running Gemini TTS: {e}")
        return None