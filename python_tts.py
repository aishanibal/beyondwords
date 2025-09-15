#!/usr/bin/env python3
"""
Pure Python TTS using pyttsx3
No system dependencies required - works on any platform
"""

import os
import tempfile
import subprocess
from typing import Optional

def synthesize_speech_python(text: str, language_code: str, output_path: str) -> Optional[str]:
    """
    Synthesize speech using pure Python TTS (pyttsx3)
    This works without any system dependencies
    """
    try:
        import pyttsx3
        from pydub import AudioSegment
        from pydub.generators import Sine
        import io
        
        print(f"🐍 Pure Python TTS: Processing text (length: {len(text)})")
        print(f"🐍 Language code: {language_code}")
        print(f"🐍 Output path: {output_path}")
        
        # Initialize pyttsx3 engine
        engine = pyttsx3.init()
        
        # Set properties
        engine.setProperty('rate', 150)  # Speed of speech
        engine.setProperty('volume', 0.8)  # Volume level (0.0 to 1.0)
        
        # Try to set voice based on language
        voices = engine.getProperty('voices')
        if voices:
            # Try to find a voice that matches the language
            for voice in voices:
                if language_code in voice.id.lower() or language_code in voice.name.lower():
                    engine.setProperty('voice', voice.id)
                    print(f"🐍 Using voice: {voice.name} ({voice.id})")
                    break
            else:
                # Use default voice if no match found
                if voices:
                    engine.setProperty('voice', voices[0].id)
                    print(f"🐍 Using default voice: {voices[0].name}")
        
        # Create temporary file for audio
        with tempfile.NamedTemporaryFile(suffix='.wav', delete=False) as temp_file:
            temp_path = temp_file.name
        
        # Save to temporary file
        engine.save_to_file(text, temp_path)
        engine.runAndWait()
        
        # Check if file was created and has content
        if os.path.exists(temp_path) and os.path.getsize(temp_path) > 0:
            # Convert to the desired format if needed
            if output_path.endswith('.mp3'):
                # Convert WAV to MP3 using pydub
                audio = AudioSegment.from_wav(temp_path)
                audio.export(output_path, format="mp3")
                print(f"🐍 Converted to MP3: {output_path}")
            elif output_path.endswith('.aiff'):
                # Convert WAV to AIFF using pydub
                audio = AudioSegment.from_wav(temp_path)
                audio.export(output_path, format="aiff")
                print(f"🐍 Converted to AIFF: {output_path}")
            else:
                # Keep as WAV
                os.rename(temp_path, output_path)
                print(f"🐍 Saved as WAV: {output_path}")
            
            # Clean up temp file
            if os.path.exists(temp_path):
                os.unlink(temp_path)
            
            # Verify final file
            if os.path.exists(output_path) and os.path.getsize(output_path) > 0:
                print(f"✅ Pure Python TTS successful: {output_path}")
                return output_path
            else:
                print(f"❌ Final file not created or empty: {output_path}")
                return None
        else:
            print(f"❌ Temporary file not created or empty: {temp_path}")
            return None
            
    except ImportError as e:
        print(f"❌ pyttsx3 not available: {e}")
        return None
    except Exception as e:
        print(f"❌ Pure Python TTS error: {e}")
        return None

def create_fallback_audio(text: str, output_path: str) -> str:
    """
    Create a simple beep sound as fallback when TTS fails
    """
    try:
        from pydub import AudioSegment
        from pydub.generators import Sine
        
        print(f"🔇 Creating fallback audio for text: {text[:50]}...")
        
        # Create a simple beep sound
        duration_ms = min(len(text) * 50, 3000)  # Max 3 seconds
        beep = Sine(440).to_audio_segment(duration=duration_ms)
        
        # Add a short pause
        silence = AudioSegment.silent(duration=200)
        audio = beep + silence
        
        # Save in the requested format
        if output_path.endswith('.mp3'):
            audio.export(output_path, format="mp3")
        elif output_path.endswith('.aiff'):
            audio.export(output_path, format="aiff")
        else:
            audio.export(output_path, format="wav")
        
        print(f"🔇 Fallback audio created: {output_path}")
        return output_path
        
    except Exception as e:
        print(f"❌ Fallback audio creation failed: {e}")
        # Create empty file as last resort
        with open(output_path, 'wb') as f:
            f.write(b'')
        return output_path
