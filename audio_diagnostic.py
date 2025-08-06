#!/usr/bin/env python3
"""
Audio File Diagnostic Tool
Analyzes audio files to identify potential issues
"""

import os
import sys
import json
import subprocess

def analyze_audio(audio_file):
    """Analyze audio file for potential issues"""
    
    print(f"🔍 Analyzing: {audio_file}")
    print("=" * 50)
    
    if not os.path.exists(audio_file):
        print("❌ File not found")
        return
    
    # Basic file info
    file_size = os.path.getsize(audio_file)
    print(f"📏 File size: {file_size} bytes ({file_size/1024:.1f} KB)")
    
    if file_size < 1000:
        print("❌ File too small - might be empty or corrupted")
        return
    
    # Audio analysis using ffprobe
    try:
        cmd = ['ffprobe', '-v', 'quiet', '-print_format', 'json', 
               '-show_format', '-show_streams', audio_file]
        result = subprocess.run(cmd, capture_output=True, text=True)
        
        if result.returncode == 0:
            info = json.loads(result.stdout)
            
            if 'format' in info:
                format_info = info['format']
                duration = format_info.get('duration', 'unknown')
                bit_rate = format_info.get('bit_rate', 'unknown')
                print(f"⏱️ Duration: {duration} seconds")
                print(f"📊 Bit rate: {bit_rate} bps")
            
            if 'streams' in info and len(info['streams']) > 0:
                stream = info['streams'][0]
                codec = stream.get('codec_name', 'unknown')
                sample_rate = stream.get('sample_rate', 'unknown')
                channels = stream.get('channels', 'unknown')
                duration = stream.get('duration', 'unknown')
                
                print(f"🎵 Audio stream:")
                print(f"   Codec: {codec}")
                print(f"   Sample rate: {sample_rate} Hz")
                print(f"   Channels: {channels}")
                print(f"   Duration: {duration} seconds")
                
                # Check for potential issues
                if duration != 'unknown':
                    duration_float = float(duration)
                    if duration_float < 2:
                        print("⚠️ Audio is very short (< 2 seconds)")
                    elif duration_float > 60:
                        print("⚠️ Audio is very long (> 60 seconds)")
                
                if sample_rate != 'unknown':
                    sample_rate_int = int(sample_rate)
                    if sample_rate_int < 8000:
                        print("⚠️ Sample rate is very low (< 8kHz)")
                    elif sample_rate_int > 48000:
                        print("⚠️ Sample rate is very high (> 48kHz)")
                
                if channels != 'unknown':
                    channels_int = int(channels)
                    if channels_int > 1:
                        print("⚠️ Audio is stereo (should be mono for transcription)")
                
            else:
                print("❌ No audio streams found")
                
        else:
            print(f"❌ ffprobe failed: {result.stderr}")
            
    except Exception as e:
        print(f"❌ Analysis error: {e}")
    
    # Check audio levels (rough estimate)
    try:
        cmd = ['ffmpeg', '-i', audio_file, '-af', 'volumedetect', '-f', 'null', '-']
        result = subprocess.run(cmd, capture_output=True, text=True)
        
        if result.returncode == 0:
            output = result.stderr
            if 'mean_volume' in output:
                # Extract mean volume
                for line in output.split('\n'):
                    if 'mean_volume' in line:
                        volume = line.split(':')[1].strip()
                        print(f"🔊 Mean volume: {volume}")
                        
                        # Check if audio is too quiet
                        if 'dB' in volume:
                            try:
                                db_value = float(volume.replace(' dB', ''))
                                if db_value < -30:
                                    print("⚠️ Audio is very quiet (< -30 dB)")
                                elif db_value > -10:
                                    print("⚠️ Audio is very loud (> -10 dB)")
                            except:
                                pass
                        break
        else:
            print("⚠️ Could not analyze audio levels")
            
    except Exception as e:
        print(f"⚠️ Volume analysis error: {e}")
    
    # Try to play a snippet to verify it's not silent
    print("\n🎵 Testing audio playback...")
    try:
        # Extract first 3 seconds for testing
        test_file = "test_snippet.wav"
        cmd = ['ffmpeg', '-i', audio_file, '-t', '3', '-y', test_file]
        result = subprocess.run(cmd, capture_output=True, text=True)
        
        if result.returncode == 0 and os.path.exists(test_file):
            test_size = os.path.getsize(test_file)
            print(f"✅ Created test snippet: {test_size} bytes")
            
            # Check if snippet has audio data
            with open(test_file, 'rb') as f:
                data = f.read()
                if len(data) > 1000:
                    # Check if it's not all zeros
                    first_bytes = data[:1000]
                    if any(b != 0 for b in first_bytes):
                        print("✅ Audio contains actual data (not silent)")
                    else:
                        print("❌ Audio appears to be silent (all zeros)")
                else:
                    print("❌ Test snippet too small")
            
            # Clean up
            try:
                os.remove(test_file)
            except:
                pass
        else:
            print("❌ Could not create test snippet")
            
    except Exception as e:
        print(f"⚠️ Test snippet error: {e}")

def main():
    """Main function"""
    
    print("🔍 Audio File Diagnostic Tool")
    print("=" * 35)
    
    if len(sys.argv) > 1:
        audio_file = sys.argv[1]
        analyze_audio(audio_file)
    else:
        print("📁 Enter audio file name:")
        audio_file = input("File: ").strip()
        
        if audio_file:
            analyze_audio(audio_file)
        else:
            print("❌ No file provided")

if __name__ == "__main__":
    main() 