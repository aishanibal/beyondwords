#!/usr/bin/env python3
"""
Simple WAV to MP3 Converter
"""

import os
import sys
import subprocess

def convert_wav_to_mp3(wav_file, output_file=None):
    """Convert WAV file to MP3"""
    
    if not os.path.exists(wav_file):
        print(f"❌ File not found: {wav_file}")
        return None
    
    if not wav_file.lower().endswith('.wav'):
        print(f"⚠️ File doesn't appear to be WAV: {wav_file}")
    
    # Generate output filename if not provided
    if output_file is None:
        base_name = os.path.splitext(wav_file)[0]
        output_file = f"{base_name}.mp3"
    
    print(f"🔄 Converting {wav_file} to {output_file}")
    
    # Convert using ffmpeg
    cmd = [
        'ffmpeg', '-i', wav_file, '-acodec', 'mp3',
        '-ar', '16000', '-ac', '1', '-y', output_file
    ]
    
    print(f"📝 Command: {' '.join(cmd)}")
    
    try:
        result = subprocess.run(cmd, capture_output=True, text=True)
        
        if result.returncode == 0:
            if os.path.exists(output_file):
                size = os.path.getsize(output_file)
                print(f"✅ Successfully converted to: {output_file}")
                print(f"📏 File size: {size} bytes ({size/1024:.1f} KB)")
                return output_file
            else:
                print("❌ Output file not created")
                return None
        else:
            print(f"❌ Conversion failed: {result.stderr}")
            return None
            
    except Exception as e:
        print(f"❌ Error during conversion: {e}")
        return None

def main():
    """Main function"""
    
    print("🔄 WAV to MP3 Converter")
    print("=" * 25)
    
    # Check if file provided as argument
    if len(sys.argv) > 1:
        wav_file = sys.argv[1]
        output_file = sys.argv[2] if len(sys.argv) > 2 else None
        
        result = convert_wav_to_mp3(wav_file, output_file)
        if result:
            print(f"\n🎉 Conversion successful!")
            print(f"📁 Output: {result}")
        else:
            print(f"\n❌ Conversion failed!")
    else:
        # Interactive mode
        print("📁 Enter the WAV file name:")
        wav_file = input("File: ").strip()
        
        if not wav_file:
            print("❌ No file provided")
            return
        
        if not os.path.exists(wav_file):
            print(f"❌ File not found: {wav_file}")
            return
        
        result = convert_wav_to_mp3(wav_file)
        if result:
            print(f"\n🎉 Conversion successful!")
            print(f"📁 Output: {result}")
        else:
            print(f"\n❌ Conversion failed!")

if __name__ == "__main__":
    main() 