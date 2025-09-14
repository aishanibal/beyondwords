#!/usr/bin/env python3
"""
Test script to verify Linux TTS functionality on Render
"""
import subprocess
import os
import sys

def test_espeak_installation():
    """Test if espeak is properly installed"""
    print("🔍 Testing espeak installation...")
    
    try:
        # Check if espeak is available
        result = subprocess.run(['which', 'espeak'], capture_output=True, text=True)
        if result.returncode == 0:
            print("✅ espeak found in PATH")
            
            # Get espeak version
            version_result = subprocess.run(['espeak', '--version'], capture_output=True, text=True)
            if version_result.returncode == 0:
                print(f"✅ espeak version: {version_result.stdout.strip()}")
            else:
                print(f"⚠️ Could not get espeak version: {version_result.stderr}")
            
            return True
        else:
            print("❌ espeak not found in PATH")
            return False
            
    except Exception as e:
        print(f"❌ Error checking espeak: {e}")
        return False

def test_espeak_tts():
    """Test espeak TTS functionality"""
    print("\n🎤 Testing espeak TTS functionality...")
    
    try:
        # Test text
        test_text = "Hello, this is a test of the Linux TTS system."
        output_file = "/tmp/test_tts.wav"
        
        # Remove existing test file
        if os.path.exists(output_file):
            os.remove(output_file)
        
        # Run espeak command
        cmd = [
            'espeak',
            '-s', '150',           # Speed
            '-v', 'en',            # Voice
            '-w', output_file,     # Output file
            test_text              # Text to speak
        ]
        
        print(f"🖥️ Running command: {' '.join(cmd)}")
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=30)
        
        if result.returncode == 0:
            if os.path.exists(output_file) and os.path.getsize(output_file) > 0:
                file_size = os.path.getsize(output_file)
                print(f"✅ espeak TTS test successful!")
                print(f"✅ Output file: {output_file}")
                print(f"✅ File size: {file_size} bytes")
                
                # Clean up test file
                try:
                    os.remove(output_file)
                    print("✅ Test file cleaned up")
                except:
                    pass
                
                return True
            else:
                print(f"❌ espeak completed but no output file created: {output_file}")
                return False
        else:
            print(f"❌ espeak failed with return code {result.returncode}")
            print(f"❌ stderr: {result.stderr}")
            print(f"❌ stdout: {result.stdout}")
            return False
            
    except subprocess.TimeoutExpired:
        print("❌ espeak command timed out")
        return False
    except Exception as e:
        print(f"❌ Error testing espeak TTS: {e}")
        return False

def test_available_voices():
    """Test available espeak voices"""
    print("\n🗣️ Testing available espeak voices...")
    
    try:
        # Get list of available voices
        result = subprocess.run(['espeak', '--voices'], capture_output=True, text=True)
        if result.returncode == 0:
            voices = result.stdout.strip().split('\n')
            print(f"✅ Found {len(voices)} available voices:")
            for voice in voices[:10]:  # Show first 10 voices
                print(f"   {voice}")
            if len(voices) > 10:
                print(f"   ... and {len(voices) - 10} more")
            return True
        else:
            print(f"❌ Could not get voice list: {result.stderr}")
            return False
            
    except Exception as e:
        print(f"❌ Error getting voice list: {e}")
        return False

def main():
    """Main test function"""
    print("🚀 Linux TTS Test Suite")
    print("=" * 50)
    
    # Test espeak installation
    espeak_installed = test_espeak_installation()
    
    if espeak_installed:
        # Test TTS functionality
        tts_works = test_espeak_tts()
        
        # Test available voices
        voices_available = test_available_voices()
        
        print("\n📊 Test Results:")
        print("=" * 50)
        print(f"✅ espeak installed: {espeak_installed}")
        print(f"✅ TTS functionality: {tts_works}")
        print(f"✅ Voices available: {voices_available}")
        
        if espeak_installed and tts_works:
            print("\n🎉 Linux TTS is working correctly!")
            return 0
        else:
            print("\n❌ Linux TTS has issues")
            return 1
    else:
        print("\n❌ espeak is not installed")
        return 1

if __name__ == "__main__":
    sys.exit(main())
