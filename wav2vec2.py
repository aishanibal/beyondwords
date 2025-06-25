import os
import subprocess
import numpy as np
from transformers import Wav2Vec2ForCTC, Wav2Vec2Processor
import torch
import Levenshtein
import librosa
import whisper
import re
import sys
import io
import contextlib

# ---- CONFIG ----
AUDIO_PATH = sys.argv[1]  # Audio file path passed as argument
ESPEAK_PATH = "espeak"  # Path to espeak binary (assumes in PATH)
LANG = "en"  # Language code for espeak

# ---- 1. Load Models ----
print("Loading Wav2Vec2 model...")
processor = Wav2Vec2Processor.from_pretrained("facebook/wav2vec2-base-960h")
model = Wav2Vec2ForCTC.from_pretrained("facebook/wav2vec2-base-960h")

print("Loading Whisper model...")
whisper_model = whisper.load_model("base")

# ---- 2. Audio to Text (ASR) ----
def load_audio_16k(audio_path):
    speech, rate = librosa.load(audio_path, sr=16000, mono=True)
    return speech, 16000

def audio_to_text(audio_path):
    speech, rate = load_audio_16k(audio_path)
    input_values = processor(speech, return_tensors="pt", sampling_rate=16000).input_values
    with torch.no_grad():
        logits = model(input_values).logits
    predicted_ids = torch.argmax(logits, dim=-1)
    transcription = processor.decode(predicted_ids[0])
    return transcription.lower()

def get_reference_text_with_whisper(audio_path):
    result = whisper_model.transcribe(audio_path)
    return result["text"].strip().lower()

# ---- 3. Text to Phonemes (espeak) ----
def text_to_phonemes(text, lang=LANG):
    cmd = [ESPEAK_PATH, "-q", "--ipa=3", f"-v{lang}", text]
    result = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
    phonemes = result.stdout.strip().replace(" ", "")
    return phonemes

# ---- 4. Alignment and Feedback ----
def align_and_feedback(ref_phonemes, hyp_phonemes):
    ops = Levenshtein.editops(ref_phonemes, hyp_phonemes)
    print(f"Reference phonemes: {ref_phonemes}")
    print(f"Hypothesis phonemes: {hyp_phonemes}")
    print(f"Edit operations: {ops}")
    if not ops:
        print("Great job! No mispronunciations detected.")
    else:
        print("Mispronunciations detected:")
        for op in ops:
            if op[0] == 'replace':
                print(f"Substitute '{ref_phonemes[op[1]]}' with '{hyp_phonemes[op[2]]}'")
            elif op[0] == 'delete':
                print(f"Missing '{ref_phonemes[op[1]]}'")
            elif op[0] == 'insert':
                print(f"Extra '{hyp_phonemes[op[2]]}'")

# ---- MAIN ----
if __name__ == "__main__":
    print("Getting reference text using Whisper...")
    reference_text = get_reference_text_with_whisper(AUDIO_PATH)
    print(f"Whisper reference text: {reference_text}")

    print("Transcribing audio with Wav2Vec2...")
    hyp_text = audio_to_text(AUDIO_PATH)
    print(f"Wav2Vec2 recognized text: {hyp_text}")

    print("Converting reference text to phonemes...")
    ref_phonemes = text_to_phonemes(reference_text)
    print(f"Reference phonemes: {ref_phonemes}")

    print("Converting recognized text to phonemes...")
    hyp_phonemes = text_to_phonemes(hyp_text)
    print(f"Hypothesis phonemes: {hyp_phonemes}")

    print("Aligning phonemes and generating feedback...")
    # Capture feedback output
    feedback_buffer = io.StringIO()
    with contextlib.redirect_stdout(feedback_buffer):
        align_and_feedback(ref_phonemes, hyp_phonemes)
    feedback = feedback_buffer.getvalue()

    # Save all extracted data to wav2vec2_transcription.txt
    with open("wav2vec2_transcription.txt", "w") as f:
        f.write("Wav2Vec2 Speech Analysis Output\n")
        f.write("==============================\n")
        f.write(f"Whisper reference text: {reference_text}\n")
        f.write(f"Wav2Vec2 recognized text: {hyp_text}\n")
        f.write(f"Reference phonemes: {ref_phonemes}\n")
        f.write(f"Hypothesis phonemes: {hyp_phonemes}\n")
        f.write("\nAlignment and Feedback:\n")
        f.write(feedback)
    # Also print feedback to console
    print(feedback) 