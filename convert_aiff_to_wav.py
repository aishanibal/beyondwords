#!/usr/bin/env python3
"""
Convert AIFF files to WAV format for browser compatibility
"""

import os
import subprocess
import wave
import aifc
import numpy as np
from typing import Optional

def convert_aiff_to_wav(aiff_path: str, wav_path: Optional[str] = None) -> Optional[str]:
    """
    Convert AIFF file to WAV format using ffmpeg or native Python
    
    Args:
        aiff_path: Path to the AIFF file
        wav_path: Output WAV path (optional, will use same name with .wav extension)
    
    Returns:
        Path to the converted WAV file, or None if conversion failed
    """
    
    if not os.path.exists(aiff_path):
        print(f"❌ AIFF file not found: {aiff_path}")
        return None
    
    if wav_path is None:
        wav_path = aiff_path.replace('.aiff', '.wav').replace('.aif', '.wav')
    
    print(f"🔄 Converting {aiff_path} to {wav_path}")
    
    # Try using ffmpeg first (faster and more reliable)
    try:
        cmd = ['ffmpeg', '-i', aiff_path, '-y', wav_path]
        result = subprocess.run(cmd, capture_output=True, text=True)
        
        if result.returncode == 0:
            print(f"✅ Converted using ffmpeg: {wav_path}")
            return wav_path
        else:
            print(f"❌ ffmpeg conversion failed: {result.stderr}")
    except FileNotFoundError:
        print("⚠️ ffmpeg not found, trying Python conversion...")
    except Exception as e:
        print(f"❌ ffmpeg error: {e}")
    
    # Fallback to Python conversion
    try:
        # Read AIFF file
        with aifc.open(aiff_path, 'rb') as aiff_file:
            # Get audio parameters
            channels = aiff_file.getnchannels()
            sample_width = aiff_file.getsampwidth()
            frame_rate = aiff_file.getframerate()
            n_frames = aiff_file.getnframes()
            
            # Read audio data
            audio_data = aiff_file.readframes(n_frames)
        
        # Write WAV file
        with wave.open(wav_path, 'wb') as wav_file:
            wav_file.setnchannels(channels)
            wav_file.setsampwidth(sample_width)
            wav_file.setframerate(frame_rate)
            wav_file.writeframes(audio_data)
        
        print(f"✅ Converted using Python: {wav_path}")
        return wav_path
        
    except Exception as e:
        print(f"❌ Python conversion failed: {e}")
        return None

def convert_tts_output(output_path: str) -> Optional[str]:
    """
    Convert TTS output file to WAV if it's AIFF
    
    Args:
        output_path: Path to the TTS output file
    
    Returns:
        Path to the WAV file (same as input if already WAV, converted path if AIFF)
    """
    
    if not os.path.exists(output_path):
        print(f"❌ TTS output file not found: {output_path}")
        return None
    
    # If it's already a WAV file, return as is
    if output_path.lower().endswith('.wav'):
        return output_path
    
    # If it's an AIFF file, convert to WAV
    if output_path.lower().endswith(('.aiff', '.aif')):
        wav_path = convert_aiff_to_wav(output_path)
        if wav_path and os.path.exists(wav_path):
            return wav_path
        else:
            print(f"❌ Failed to convert {output_path} to WAV")
            return None
    
    # For other formats, return as is
    return output_path

if __name__ == "__main__":
    # Test conversion
    import sys
    
    if len(sys.argv) > 1:
        aiff_file = sys.argv[1]
        wav_file = convert_aiff_to_wav(aiff_file)
        if wav_file:
            print(f"✅ Conversion successful: {wav_file}")
        else:
            print("❌ Conversion failed")
    else:
        print("Usage: python convert_aiff_to_wav.py <aiff_file>") 