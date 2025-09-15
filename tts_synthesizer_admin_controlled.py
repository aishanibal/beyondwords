#!/usr/bin/env python3
"""
Admin-Controlled TTS System
Priority: System TTS (FREE) → Google Cloud TTS (CHEAP) → Gemini TTS (EXPENSIVE)
"""

import os
import sys
import subprocess
import platform
from typing import Optional
from admin_dashboard import AdminDashboard

# Import TTS modules
try:
    from google_cloud_tts_simple import synthesize_speech as google_synthesize
except ImportError:
    print("Warning: Google Cloud TTS not available")
    google_synthesize = None

try:
    from gemini_tts_synthesizer import synthesize_speech as gemini_synthesize
except ImportError:
    print("Warning: Gemini TTS not available")
    gemini_synthesize = None

class AdminControlledTTSSynthesizer:
    def __init__(self):
        self.admin_dashboard = AdminDashboard()
        self.system = platform.system().lower()
        self.tts_cache = {}  # Simple cache to prevent duplicate processing
        
        # Voice mappings for different systems
        self.voice_map = {
            'en': {
                'macos': 'Eddy (English (US))',
                'windows': 'Microsoft David Desktop',
                'linux': 'english_rp'
            },
            'es': {
                'macos': 'Mónica (Spanish (Spain))',
                'windows': 'Microsoft Helena Desktop',
                'linux': 'spanish'
            },
            'fr': {
                'macos': 'Thomas (French (France))',
                'windows': 'Microsoft Paul Desktop',
                'linux': 'french'
            },
            'de': {
                'macos': 'Anna (German (Germany))',
                'windows': 'Microsoft Hedda Desktop',
                'linux': 'german'
            },
            'ja': {
                'macos': 'Kyoko (Japanese (Japan))',
                'windows': 'Microsoft Nanami Desktop',
                'linux': 'japanese'
            },
            'ko': {
                'macos': 'Yuna (Korean (Korea))',
                'windows': 'Microsoft Heami Desktop',
                'linux': 'korean'
            },
            'zh': {
                'macos': 'Ting-Ting (Chinese (China))',
                'windows': 'Microsoft Huihui Desktop',
                'linux': 'chinese'
            },
            'hi': {
                'macos': 'Lekha (Hindi (India))',
                'windows': 'Microsoft Kalpana Desktop',
                'linux': 'hindi'
            },
            'or': {
                'macos': 'Lekha (Hindi (India))',  # Fallback to Hindi
                'windows': 'Microsoft Kalpana Desktop',
                'linux': 'hindi'
            },
            'ta': {
                'macos': 'Lekha (Hindi (India))',  # Fallback to Hindi
                'windows': 'Microsoft Kalpana Desktop',
                'linux': 'tamil'
            },
            'ml': {
                'macos': 'Lekha (Hindi (India))',  # Fallback to Hindi
                'windows': 'Microsoft Kalpana Desktop',
                'linux': 'malayalam'
            },
            'ar': {
                'macos': 'Maged (Arabic (Egypt))',
                'windows': 'Microsoft Hoda Desktop',
                'linux': 'arabic'
            }
        }
        
        # Language code mappings for Linux
        self.lang_map = {
            'en': 'en-US',
            'es': 'es-ES',
            'fr': 'fr-FR',
            'de': 'de-DE',
            'ja': 'ja-JP',
            'ko': 'ko-KR',
            'zh': 'zh-CN',
            'hi': 'hi-IN',
            'or': 'hi-IN',  # Fallback to Hindi
            'ta': 'ta-IN',
            'ml': 'ml-IN',
            'ar': 'ar-SA'
        }

    def synthesize_speech(self, text: str, language_code: str = 'en', output_path: str = "response.wav") -> dict:
        """
        Synthesize speech with admin-controlled priority and return debug info:
        1. System TTS (FREE)
        2. Google Cloud TTS (CHEAP) 
        3. Gemini TTS (EXPENSIVE) - Admin only
        """
        # Generate unique request ID to track duplicate calls
        import time
        request_id = f"{int(time.time() * 1000)}_{hash(text)}_{hash(language_code)}"
        
        # Initialize debug info
        debug_info = {
            "request_id": request_id,
            "service_used": "none",
            "fallback_reason": "none",
            "admin_settings": {},
            "cost_estimate": "unknown",
            "success": False,
            "output_path": None,
            "debug": {}
        }
        
        # Check cache for duplicate requests
        cache_key = f"{text}_{language_code}_{output_path}"
        if cache_key in self.tts_cache:
            cached_result = self.tts_cache[cache_key]
            print(f"🎯 TTS Request ID: {request_id} - CACHED (duplicate detected)")
            print(f"🎯 Returning cached result: {cached_result}")
            debug_info.update({
                "service_used": "cached",
                "success": True,
                "output_path": cached_result,
                "fallback_reason": "Using cached result"
            })
            return {
                "success": True,
                "output_path": cached_result,
                **debug_info
            }
        
        print(f"🎯 TTS Request ID: {request_id}")
        print(f"🎯 AdminControlledTTSSynthesizer.synthesize_speech called with:")
        print(f"   text: '{text[:50]}...' (length: {len(text)})")
        print(f"   language_code: '{language_code}'")
        print(f"   output_path: '{output_path}'")
        
        # Ensure output directory exists
        output_dir = os.path.dirname(output_path)
        if output_dir:
            os.makedirs(output_dir, exist_ok=True)
        
        # Get admin settings for debug info
        settings = self.admin_dashboard.get_tts_settings()
        active_tts = settings.get("active_tts", "system")
        debug_info["admin_settings"] = settings
        
        print(f"🎯 Admin settings: {settings}")
        print(f"🎯 Active TTS system: {active_tts}")
        print(f"🎯 Using TTS system: {active_tts.upper()}")
        
        # Check if Google API services are enabled
        if not self.admin_dashboard.is_google_api_enabled():
            print("🔒 Google API services are disabled. Using System TTS only.")
            debug_info["fallback_reason"] = "Google API services disabled"
            # Force system TTS when Google APIs are disabled
            result = self._try_system_tts(text, language_code, output_path)
            if result:
                self.admin_dashboard.track_usage("system", 0.0)
                print("✅ System TTS successful (FREE)")
                self.tts_cache[cache_key] = result
                debug_info.update({
                    "service_used": "system",
                    "success": True,
                    "output_path": result,
                    "cost_estimate": "0.00"
                })
                return {
                    "success": True,
                    "output_path": result,
                    **debug_info
                }
            else:
                print("❌ System TTS failed")
                debug_info["fallback_reason"] = "System TTS failed"
        
        # Try System TTS (FREE)
        if active_tts == "system":
            print("🎤 Trying System TTS (FREE)...")
            result = self._try_system_tts(text, language_code, output_path)
            if result:
                self.admin_dashboard.track_usage("system", 0.0)
                print("✅ System TTS successful (FREE)")
                # Cache the result
                self.tts_cache[cache_key] = result
                debug_info.update({
                    "service_used": "system",
                    "success": True,
                    "output_path": result,
                    "cost_estimate": "0.00"
                })
                return {
                    "success": True,
                    "output_path": result,
                    **debug_info
                }
            else:
                print("❌ System TTS failed")
                debug_info["fallback_reason"] = "System TTS failed"
        
        # Try Google Cloud TTS (CHEAP)
        elif active_tts == "cloud":
            print(f"☁️ Google Cloud TTS available: {google_synthesize is not None}")
            if google_synthesize:
                print("☁️ Trying Google Cloud TTS (CHEAP)...")
                result = self._try_google_cloud_tts(text, language_code, output_path)
                if result:
                    # Estimate cost: ~$0.004 per 1K characters
                    estimated_cost = len(text) * 0.004 / 1000
                    self.admin_dashboard.track_usage("google_cloud", estimated_cost)
                    print(f"✅ Google Cloud TTS successful (CHEAP - ~${estimated_cost:.4f})")
                    # Cache the result
                    self.tts_cache[cache_key] = result
                    debug_info.update({
                        "service_used": "google_cloud",
                        "success": True,
                        "output_path": result,
                        "cost_estimate": f"{estimated_cost:.4f}"
                    })
                    return {
                        "success": True,
                        "output_path": result,
                        **debug_info
                    }
                else:
                    print("❌ Google Cloud TTS failed")
                    debug_info["fallback_reason"] = "Google Cloud TTS failed"
            else:
                print("❌ Google Cloud TTS not available")
                debug_info["fallback_reason"] = "Google Cloud TTS not available"
        
        # Try Gemini TTS (EXPENSIVE)
        elif active_tts == "gemini":
            print(f"🤖 Gemini TTS available: {gemini_synthesize is not None}")
            if gemini_synthesize:
                print("🤖 Trying Gemini TTS (EXPENSIVE)...")
                result = self._try_gemini_tts(text, language_code, output_path)
                if result:
                    # Estimate cost: ~$0.015 per 1K characters (much more expensive)
                    estimated_cost = len(text) * 0.015 / 1000
                    self.admin_dashboard.track_usage("gemini", estimated_cost)
                    print(f"✅ Gemini TTS successful (EXPENSIVE - ~${estimated_cost:.4f})")
                    # Cache the result
                    self.tts_cache[cache_key] = result
                    debug_info.update({
                        "service_used": "gemini",
                        "success": True,
                        "output_path": result,
                        "cost_estimate": f"{estimated_cost:.4f}"
                    })
                    return {
                        "success": True,
                        "output_path": result,
                        **debug_info
                    }
                else:
                    print("❌ Gemini TTS failed")
                    debug_info["fallback_reason"] = "Gemini TTS failed"
            else:
                print("❌ Gemini TTS not available")
                debug_info["fallback_reason"] = "Gemini TTS not available"
        
        print("❌ All TTS methods failed")
        debug_info["fallback_reason"] = "All TTS methods failed"
        
        # Create a simple fallback audio file (silence) so the frontend doesn't crash
        try:
            print("🔇 Creating fallback audio file...")
            # Create a minimal WAV file with silence
            import wave
            import struct
            
            # Create a 1-second silence WAV file
            sample_rate = 22050
            duration = 1.0
            num_samples = int(sample_rate * duration)
            
            with wave.open(output_path, 'w') as wav_file:
                wav_file.setnchannels(1)  # Mono
                wav_file.setsampwidth(2)  # 16-bit
                wav_file.setframerate(sample_rate)
                
                # Write silence (zeros)
                for _ in range(num_samples):
                    wav_file.writeframes(struct.pack('<h', 0))
            
            print(f"🔇 Fallback audio created: {output_path}")
            
            # Cache the result
            self.tts_cache[cache_key] = output_path
            debug_info.update({
                "service_used": "fallback",
                "success": True,
                "output_path": output_path,
                "cost_estimate": "0.00",
                "fallback_reason": "Created silence fallback"
            })
            return {
                "success": True,
                "output_path": output_path,
                **debug_info
            }
        except Exception as e:
            print(f"❌ Failed to create fallback audio: {e}")
            debug_info.update({
                "fallback_reason": f"Failed to create fallback audio: {e}",
                "error": str(e)
            })
            return {
                "success": False,
                "error": f"Failed to create fallback audio: {e}",
                **debug_info
            }

    def _try_system_tts(self, text: str, language_code: str, output_path: str) -> Optional[str]:
        """Try system TTS (FREE)"""
        print(f"🖥️ System TTS: platform='{self.system}', language_code='{language_code}'")
        try:
            if self.system == 'darwin':  # macOS
                voice = self.voice_map.get(language_code, {}).get('macos', 'Eddy (English (US))')
                print(f"🖥️ macOS voice: '{voice}'")
                
                # Try to create WAV directly first, fallback to AIFF if needed
                wav_path = output_path
                if not wav_path.endswith('.wav'):
                    wav_path = output_path.replace('.aiff', '.wav').replace('.mp3', '.wav')
                
                print(f"🖥️ Trying WAV path first: {wav_path}")
                
                # Try WAV first (some macOS versions support this)
                cmd_wav = ['say', '-v', voice, '-o', wav_path, text]
                result_wav = subprocess.run(cmd_wav, capture_output=True, text=True)
                
                if result_wav.returncode == 0:
                    print(f"✅ macOS TTS created WAV directly: {wav_path}")
                    return wav_path
                else:
                    print(f"⚠️ WAV creation failed, trying AIFF: {result_wav.stderr}")
                    
                    # Fallback to AIFF
                    aiff_path = output_path
                    if not aiff_path.endswith('.aiff'):
                        aiff_path = output_path.replace('.wav', '.aiff').replace('.mp3', '.aiff')
                    
                    print(f"🖥️ Using AIFF path: {aiff_path}")
                
                # Try the specific voice first
                cmd = ['say', '-v', voice, '-o', aiff_path, text]
                print(f"🖥️ Running command: {' '.join(cmd)}")
                result = subprocess.run(cmd, capture_output=True, text=True)
                print(f"🖥️ Command return code: {result.returncode}")
                if result.stderr:
                    print(f"🖥️ Command stderr: {result.stderr}")
                
                if result.returncode == 0:
                    print(f"✅ macOS TTS created file: {aiff_path}")
                    
                    # Convert AIFF to WAV for browser compatibility
                    print(f"🔄 Attempting to convert AIFF to WAV: {aiff_path}")
                    try:
                        from convert_aiff_to_wav import convert_aiff_to_wav
                        wav_path = convert_aiff_to_wav(aiff_path)
                        print(f"🔄 Conversion result: {wav_path}")
                        
                        if wav_path and os.path.exists(wav_path):
                            print(f"✅ Converted to WAV: {wav_path}")
                            print(f"✅ WAV file exists: {os.path.exists(wav_path)}")
                            print(f"✅ WAV file size: {os.path.getsize(wav_path)} bytes")
                            return wav_path
                        else:
                            print(f"⚠️ Conversion failed, using original AIFF: {aiff_path}")
                            return aiff_path
                    except Exception as conv_error:
                        print(f"⚠️ Conversion error: {conv_error}, using original AIFF: {aiff_path}")
                        return aiff_path
                else:
                    # Fallback to default voice if specific voice fails
                    print(f"🖥️ Specific voice failed, trying default voice...")
                    cmd_fallback = ['say', '-o', aiff_path, text]
                    result_fallback = subprocess.run(cmd_fallback, capture_output=True, text=True)
                    if result_fallback.returncode == 0:
                        print(f"✅ macOS TTS fallback created file: {aiff_path}")
                        
                        # Convert AIFF to WAV for browser compatibility
                        print(f"🔄 Attempting to convert fallback AIFF to WAV: {aiff_path}")
                        try:
                            from convert_aiff_to_wav import convert_aiff_to_wav
                            wav_path = convert_aiff_to_wav(aiff_path)
                            print(f"🔄 Fallback conversion result: {wav_path}")
                            
                            if wav_path and os.path.exists(wav_path):
                                print(f"✅ Converted fallback to WAV: {wav_path}")
                                print(f"✅ Fallback WAV file exists: {os.path.exists(wav_path)}")
                                print(f"✅ Fallback WAV file size: {os.path.getsize(wav_path)} bytes")
                                return wav_path
                            else:
                                print(f"⚠️ Fallback conversion failed, using original AIFF: {aiff_path}")
                                return aiff_path
                        except Exception as conv_error:
                            print(f"⚠️ Fallback conversion error: {conv_error}, using original AIFF: {aiff_path}")
                            return aiff_path
                
            elif self.system == 'windows':
                voice = self.voice_map.get(language_code, {}).get('windows', 'Microsoft David Desktop')
                # PowerShell command for Windows SAPI
                ps_script = f'''
                Add-Type -AssemblyName System.Speech
                $synth = New-Object System.Speech.Synthesis.SpeechSynthesizer
                $synth.SelectVoice("{voice}")
                $synth.Speak("{text}")
                '''
                result = subprocess.run(['powershell', '-Command', ps_script], 
                                     capture_output=True, text=True)
                if result.returncode == 0:
                    return output_path
                    
            elif self.system == 'linux':
                # Try espeak first, but fallback to festival or other alternatives
                voice = self.voice_map.get(language_code, {}).get('linux', 'english_rp')
                
                # Try espeak first
                try:
                    cmd = ['espeak', '-v', voice, '-w', output_path, text]
                    result = subprocess.run(cmd, capture_output=True, text=True, timeout=10)
                    if result.returncode == 0 and os.path.exists(output_path):
                        print(f"✅ espeak TTS successful: {output_path}")
                        return output_path
                except (subprocess.TimeoutExpired, FileNotFoundError) as e:
                    print(f"⚠️ espeak failed: {e}")
                
                # Try festival as fallback
                try:
                    cmd = ['festival', '--tts', '--pipe']
                    with open(output_path, 'wb') as f:
                        result = subprocess.run(cmd, input=text, stdout=f, stderr=subprocess.PIPE, text=True, timeout=10)
                    if result.returncode == 0 and os.path.exists(output_path):
                        print(f"✅ festival TTS successful: {output_path}")
                        return output_path
                except (subprocess.TimeoutExpired, FileNotFoundError) as e:
                    print(f"⚠️ festival failed: {e}")
                
                # Try spd-say as another fallback
                try:
                    cmd = ['spd-say', '-w', '-o', output_path, text]
                    result = subprocess.run(cmd, capture_output=True, text=True, timeout=10)
                    if result.returncode == 0 and os.path.exists(output_path):
                        print(f"✅ spd-say TTS successful: {output_path}")
                        return output_path
                except (subprocess.TimeoutExpired, FileNotFoundError) as e:
                    print(f"⚠️ spd-say failed: {e}")
                
                # If all TTS systems fail, create a simple beep sound
                print("🔇 All Linux TTS systems failed, creating simple audio file...")
                return self._create_simple_audio_file(text, output_path)
                    
        except Exception as e:
            print(f"System TTS error: {e}")
        
        return None

    def _create_simple_audio_file(self, text: str, output_path: str) -> Optional[str]:
        """Create a simple audio file with a beep sound as fallback"""
        try:
            import wave
            import struct
            import math
            
            # Create a simple beep sound
            sample_rate = 22050
            duration = min(len(text) * 0.1, 3.0)  # Duration based on text length, max 3 seconds
            frequency = 440  # A4 note
            
            num_samples = int(sample_rate * duration)
            
            # Generate a simple sine wave beep
            samples = []
            for i in range(num_samples):
                t = i / sample_rate
                sample = int(32767 * 0.3 * math.sin(2 * math.pi * frequency * t))
                samples.append(sample)
            
            # Write WAV file
            with wave.open(output_path, 'w') as wav_file:
                wav_file.setnchannels(1)  # Mono
                wav_file.setsampwidth(2)  # 16-bit
                wav_file.setframerate(sample_rate)
                wav_file.writeframes(struct.pack('<' + 'h' * len(samples), *samples))
            
            print(f"🔇 Created simple beep audio file: {output_path}")
            return output_path
            
        except Exception as e:
            print(f"🔇 Failed to create simple audio file: {e}")
            return None

    def _try_google_cloud_tts(self, text: str, language_code: str, output_path: str) -> Optional[str]:
        """Try Google Cloud TTS (CHEAP)"""
        print(f"☁️ _try_google_cloud_tts called with:")
        print(f"   text: '{text[:50]}...' (length: {len(text)})")
        print(f"   language_code: '{language_code}'")
        print(f"   output_path: '{output_path}'")
        print(f"   google_synthesize available: {google_synthesize is not None}")
        
        if not google_synthesize:
            print("❌ Google Cloud TTS not available (google_synthesize is None)")
            return None
            
        try:
            # Change extension to .mp3 for Google Cloud TTS
            mp3_path = output_path.replace('.wav', '.mp3')
            print(f"☁️ Calling google_synthesize with mp3_path: {mp3_path}")
            result = google_synthesize(text, language_code, mp3_path)
            print(f"☁️ google_synthesize result: {result}")
            if result:
                return mp3_path
            else:
                print("❌ google_synthesize returned None")
        except Exception as e:
            print(f"❌ Google Cloud TTS error: {e}")
            import traceback
            traceback.print_exc()
        
        return None

    def _try_gemini_tts(self, text: str, language_code: str, output_path: str) -> Optional[str]:
        """Try Gemini TTS (EXPENSIVE) - Admin only"""
        if not gemini_synthesize:
            return None
            
        try:
            result = gemini_synthesize(text, language_code, output_path)
            if result:
                return output_path
        except Exception as e:
            print(f"Gemini TTS error: {e}")
        
        return None

    def get_tts_status(self) -> dict:
        """Get current TTS system status"""
        return {
            "system_tts": "Available" if self.system in ['darwin', 'windows', 'linux'] else "Not available",
            "google_cloud_tts": "Available" if google_synthesize else "Not available",
            "gemini_tts": "Available (Admin controlled)" if gemini_synthesize else "Not available",
            "gemini_enabled": self.admin_dashboard.is_gemini_allowed(),
            "current_priority": "System (FREE) → Google Cloud (CHEAP) → Gemini (EXPENSIVE)",
            "usage_stats": self.admin_dashboard.get_usage_stats()
        }

def synthesize_speech(text: str, language_code: str = 'en', output_path: str = "response.wav") -> Optional[str]:
    """Main function for TTS synthesis with admin control"""
    synthesizer = AdminControlledTTSSynthesizer()
    return synthesizer.synthesize_speech(text, language_code, output_path)

if __name__ == "__main__":
    # Test the system
    synthesizer = AdminControlledTTSSynthesizer()
    
    print("🔐 Admin-Controlled TTS System")
    print("=" * 50)
    
    # Show status
    status = synthesizer.get_tts_status()
    print("\n📊 System Status:")
    for key, value in status.items():
        if key != "usage_stats":
            print(f"  {key}: {value}")
    
    # Test synthesis
    test_text = "Hello, this is a test of the admin-controlled TTS system."
    print(f"\n🧪 Testing with: '{test_text}'")
    
    result = synthesizer.synthesize_speech(test_text, 'en', 'test_output.wav')
    if result:
        print(f"✅ Success! Output: {result}")
    else:
        print("❌ Failed to synthesize speech") 