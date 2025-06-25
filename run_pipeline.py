#!/usr/bin/env python3
"""
BeyondWords Speech Analysis Pipeline (Wav2Vec2 version)
Runs wav2vec2.py for all analysis, tracks all subprocesses, and feeds output to Ollama
"""

import subprocess
import sys
import os
import time
from pathlib import Path

# =============================================================================
# CONFIGURATION - Change these settings as needed
# =============================================================================
AUDIO_DIR = "audio_files"  # Directory containing audio files
AUDIO_FILENAME = "text_audio.wav"  # Always use .wav for all steps
MP3_FILENAME = "text_audio.mp3"
WAV2VEC2_LOG = "wav2vec2_log.txt"
WAV2VEC2_OUTPUT = "wav2vec2_transcription.txt"
OLLAMA_INPUT = "wav2vec2_transcription.txt"
# =============================================================================

class SpeechAnalysisPipeline:
    def __init__(self):
        self.audio_wav_path = os.path.join(AUDIO_DIR, AUDIO_FILENAME)
        self.audio_mp3_path = os.path.join(AUDIO_DIR, MP3_FILENAME)

    def print_step(self, step_name: str):
        print(f"\n{'='*60}")
        print(f"{step_name}")
        print(f"{'='*60}")

    def ensure_wav_audio(self):
        """If only mp3 exists, convert it to wav using ffmpeg."""
        if os.path.exists(self.audio_wav_path):
            print(f"Found WAV audio: {self.audio_wav_path}")
            return True
        elif os.path.exists(self.audio_mp3_path):
            print(f"Converting {self.audio_mp3_path} to {self.audio_wav_path}...")
            try:
                result = subprocess.run([
                    "ffmpeg", "-y", "-i", self.audio_mp3_path, self.audio_wav_path
                ], capture_output=True, text=True, check=True)
                print("✓ Conversion complete.")
                return True
            except subprocess.CalledProcessError as e:
                print(f"✗ Error converting mp3 to wav: {e}")
                print(e.stdout)
                print(e.stderr)
                return False
        else:
            print(f"❌ No audio file found: {self.audio_wav_path} or {self.audio_mp3_path}")
            return False

    def run_wav2vec2(self) -> bool:
        """Run wav2vec2.py, capture all output, and save transcription/feedback"""
        if not os.path.exists(self.audio_wav_path):
            print(f"{self.audio_wav_path} not found. Please ensure audio file exists.")
            return False
        print(f"Running: python wav2vec2.py {self.audio_wav_path}")
        with open(WAV2VEC2_LOG, "w") as logf:
            try:
                result = subprocess.run([
                    sys.executable, "wav2vec2.py", self.audio_wav_path
                ], capture_output=True, text=True, check=True)
                logf.write(result.stdout)
                logf.write("\n--- STDERR ---\n")
                logf.write(result.stderr)
                print("✓ Wav2Vec2 step completed")
                # Save the full output to wav2vec2_transcription.txt
                if result.stdout.strip():
                    with open(WAV2VEC2_OUTPUT, "w") as outf:
                        outf.write(result.stdout.strip())
                return True
            except subprocess.CalledProcessError as e:
                logf.write(e.stdout or "")
                logf.write("\n--- STDERR ---\n")
                logf.write(e.stderr or "")
                print(f"✗ Error running wav2vec2.py: {e}")
                return False

    def run_ollama_analysis(self) -> bool:
        """Run Ollama analysis, feeding in wav2vec2 output as prompt"""
        if not os.path.exists(OLLAMA_INPUT):
            print(f"Missing required file: {OLLAMA_INPUT}")
            return False
        # Read the transcription/feedback
        with open(OLLAMA_INPUT, "r") as f:
            prompt = f.read()
        print(f"Feeding this to Ollama:\n{prompt}\n{'-'*40}")
        # Call ollama_speech_analyzer.py with the prompt as an argument
        try:
            result = subprocess.run([
                sys.executable, "ollama_speech_analyzer.py", prompt
            ], capture_output=True, text=True, check=True)
            print(result.stdout)
            if result.stderr.strip():
                print("--- STDERR ---\n" + result.stderr)
            return True
        except subprocess.CalledProcessError as e:
            print(f"✗ Error running Ollama analysis: {e}")
            print(e.stdout)
            print(e.stderr)
            return False

    def run_pipeline(self):
        print("\U0001F3A4 BEYONDWORDS SPEECH ANALYSIS PIPELINE (Wav2Vec2)")
        print("="*60)
        print(f"Audio file: {self.audio_wav_path}")
        print("Make sure you have:")
        print(f"- Audio file in {AUDIO_DIR}/ directory (either .wav or .mp3)")
        print("- All required dependencies installed")
        print("- Ollama running (for final step)")
        print()
        if not self.ensure_wav_audio():
            print(f"\u274c ERROR: No valid audio file found!")
            return
        print(f"\u2705 Audio file ready: {self.audio_wav_path}")

        self.print_step("Wav2Vec2 Analysis and Feedback")
        if not self.run_wav2vec2():
            print(f"\u274c Wav2Vec2 step failed. See {WAV2VEC2_LOG} for details.")
            return
        print(f"\u2705 Wav2Vec2 step complete. Log: {WAV2VEC2_LOG}")

        self.print_step("Ollama Analysis")
        if not self.run_ollama_analysis():
            print(f"\u274c Ollama analysis failed.")
            return
        print(f"\u2705 Ollama analysis complete.")
        print(f"\n{'='*60}")
        print("\U0001F389 PIPELINE COMPLETE!")
        print(f"{'='*60}")
        print(f"Check {WAV2VEC2_LOG} and ollama_analysis.txt for results.")

def main():
    pipeline = SpeechAnalysisPipeline()
    pipeline.run_pipeline()

if __name__ == "__main__":
    main() 