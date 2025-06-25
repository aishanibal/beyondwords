from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import json
import subprocess
import tempfile
import shutil
from werkzeug.utils import secure_filename
import whisper
import torch
from transformers import Wav2Vec2ForCTC, Wav2Vec2Processor
import librosa
import numpy as np

app = Flask(__name__)
CORS(app)

# Global variables for models
whisper_model = None
wav2vec2_processor = None
wav2vec2_model = None

def load_models():
    """Load speech recognition models"""
    global whisper_model, wav2vec2_processor, wav2vec2_model
    
    print("Loading Whisper model...")
    whisper_model = whisper.load_model("base")
    
    print("Loading Wav2Vec2 model...")
    wav2vec2_processor = Wav2Vec2Processor.from_pretrained("facebook/wav2vec2-base-960h")
    wav2vec2_model = Wav2Vec2ForCTC.from_pretrained("facebook/wav2vec2-base-960h")
    
    print("All models loaded successfully!")

def transcribe_audio(audio_path):
    """Transcribe audio using Whisper"""
    try:
        result = whisper_model.transcribe(audio_path)
        return result["text"]
    except Exception as e:
        print(f"Whisper transcription error: {e}")
        return ""

def analyze_speech_with_wav2vec2(audio_path, reference_text):
    """Analyze speech using Wav2Vec2 and provide feedback"""
    try:
        # Load and preprocess audio with better error handling
        print(f"Loading audio file: {audio_path}")
        
        # Try multiple approaches to load audio
        audio = None
        sr = 16000
        
        try:
            # First try with soundfile
            import soundfile as sf
            audio, sr = sf.read(audio_path)
            print(f"Successfully loaded with soundfile: {sr}Hz")
        except Exception as e1:
            print(f"Soundfile failed: {e1}")
            try:
                # Fallback to librosa
                audio, sr = librosa.load(audio_path, sr=16000)
                print(f"Successfully loaded with librosa: {sr}Hz")
            except Exception as e2:
                print(f"Librosa failed: {e2}")
                try:
                    # Last resort: try with scipy
                    from scipy.io import wavfile
                    sr, audio = wavfile.read(audio_path)
                    if audio.dtype != np.float32:
                        audio = audio.astype(np.float32) / np.iinfo(audio.dtype).max
                    print(f"Successfully loaded with scipy: {sr}Hz")
                except Exception as e3:
                    print(f"All audio loading methods failed: {e3}")
                    return {
                        "transcription": "",
                        "reference": reference_text,
                        "analysis": "Error: Could not load audio file. Please ensure it's a valid audio format (WAV, MP3, etc.)"
                    }
        
        # Ensure audio is mono and correct sample rate
        if len(audio.shape) > 1:
            audio = np.mean(audio, axis=1)  # Convert stereo to mono
        
        if sr != 16000:
            # Resample if necessary
            audio = librosa.resample(audio, orig_sr=sr, target_sr=16000)
            sr = 16000
        
        print(f"Audio loaded successfully: shape={audio.shape}, sr={sr}Hz")
        
        # Use the proper Wav2Vec2 analysis from wav2vec2.py
        print("Getting reference text using Whisper...")
        reference_text_whisper = whisper_model.transcribe(audio_path)["text"].strip().lower()
        print(f"Whisper reference text: {reference_text_whisper}")

        print("Transcribing audio with Wav2Vec2...")
        input_values = wav2vec2_processor(audio, return_tensors="pt", sampling_rate=16000).input_values
        with torch.no_grad():
            logits = wav2vec2_model(input_values).logits
        predicted_ids = torch.argmax(logits, dim=-1)
        transcription = wav2vec2_processor.decode(predicted_ids[0]).lower()
        with open("wav2vec2_words.txt", "w") as f:f.write(transcription)
        print(f"Wav2Vec2 recognized text: {transcription}")

        # Text to phonemes conversion (simplified version of wav2vec2.py)
        def text_to_phonemes(text):
            try:
                import subprocess
                cmd = ["espeak", "-q", "--ipa=3", "-ven", text]
                result = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
                phonemes = result.stdout.strip().replace(" ", "")
                return phonemes
            except Exception as e:
                print(f"Phoneme conversion failed: {e}")
                return ""

        print("Converting reference text to phonemes...")
        ref_phonemes = text_to_phonemes(reference_text_whisper)
        print(f"Reference phonemes: {ref_phonemes}")

        print("Converting recognized text to phonemes...")
        hyp_phonemes = text_to_phonemes(transcription)
        print(f"Hypothesis phonemes: {hyp_phonemes}")

        # Phoneme alignment and feedback (from wav2vec2.py)
        print("Aligning phonemes and generating feedback...")
        try:
            import Levenshtein
            ops = Levenshtein.editops(ref_phonemes, hyp_phonemes)
            
            feedback_parts = []
            feedback_parts.append("🎯 Pronunciation Analysis")
            feedback_parts.append("=" * 30)
            
            if not ops:
                feedback_parts.append("✅ Great job! No mispronunciations detected.")
            else:
                feedback_parts.append("⚠️ Mispronunciations detected:")
                for op in ops:
                    if op[0] == 'replace':
                        feedback_parts.append(f"• Substitute '{ref_phonemes[op[1]]}' with '{hyp_phonemes[op[2]]}'")
                    elif op[0] == 'delete':
                        feedback_parts.append(f"• Missing '{ref_phonemes[op[1]]}'")
                    elif op[0] == 'insert':
                        feedback_parts.append(f"• Extra '{hyp_phonemes[op[2]]}'")
            
            # Overall assessment
            similarity = 1 - (len(ops) / max(len(ref_phonemes), 1))
            if similarity > 0.9:
                feedback_parts.append("\n🌟 Excellent pronunciation! Keep up the great work.")
            elif similarity > 0.7:
                feedback_parts.append("\n👍 Good effort! With practice, you'll improve further.")
            else:
                feedback_parts.append("\n💡 Try speaking more slowly and clearly.")
            
            analysis = "\n".join(feedback_parts)
            
        except ImportError:
            # Fallback if Levenshtein is not available
            analysis = f"Transcription: {transcription}\nReference: {reference_text_whisper}\nKeep practicing!"
        
        return {
            "transcription": transcription,
            "reference": reference_text_whisper,
            "analysis": analysis
        }
        
    except Exception as e:
        print(f"Wav2Vec2 analysis error: {e}")
        import traceback
        traceback.print_exc()
        return {
            "transcription": "",
            "reference": reference_text,
            "analysis": f"Error analyzing speech: {str(e)}"
        }

def generate_speech_feedback(transcription, reference_text):
    """Generate feedback based on transcription vs reference"""
    if not transcription or not reference_text:
        return "Unable to analyze speech. Please try again."
    
    # Simple feedback generation
    feedback_parts = []
    
    # Check for basic pronunciation issues
    if len(transcription.split()) < len(reference_text.split()) * 0.7:
        feedback_parts.append("• You may be speaking too quickly or unclearly")
    
    # Check for common pronunciation patterns
    common_issues = []
    if "th" in reference_text.lower() and "th" not in transcription.lower():
        common_issues.append("'th' sounds")
    if "ing" in reference_text.lower() and "ing" not in transcription.lower():
        common_issues.append("'-ing' endings")
    
    if common_issues:
        feedback_parts.append(f"• Pay attention to: {', '.join(common_issues)}")
    
    # Overall assessment
    similarity = len(set(transcription.lower().split()) & set(reference_text.lower().split())) / max(len(reference_text.split()), 1)
    
    if similarity > 0.8:
        feedback_parts.append("• Excellent pronunciation! Keep up the great work.")
    elif similarity > 0.6:
        feedback_parts.append("• Good effort! With practice, you'll improve further.")
    else:
        feedback_parts.append("• Try speaking more slowly and clearly.")
    
    return "\n".join(feedback_parts) if feedback_parts else "Thank you for your speech. Keep practicing!"

@app.route('/transcribe', methods=['POST'])
def transcribe():
    """Transcribe audio file"""
    try:
        data = request.get_json()
        audio_file = data.get('audio_file')
        
        if not audio_file or not os.path.exists(audio_file):
            return jsonify({"error": "Audio file not found"}), 400
        
        transcription = transcribe_audio(audio_file)
        
        return jsonify({
            "transcription": transcription,
            "success": True
        })
    
    except Exception as e:
        print(f"Transcription error: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/analyze', methods=['POST'])
def analyze():
    """Analyze speech and provide feedback"""
    try:
        data = request.get_json()
        audio_file = data.get('audio_file')
        transcription = data.get('transcription', '')
        
        if not audio_file or not os.path.exists(audio_file):
            return jsonify({"error": "Audio file not found"}), 400
        
        # Use transcription as reference text for analysis
        reference_text = transcription if transcription else "Speech recorded"
        
        analysis_result = analyze_speech_with_wav2vec2(audio_file, reference_text)
        
        return jsonify({
            "analysis": analysis_result["analysis"],
            "transcription": analysis_result["transcription"],
            "success": True
        })
    
    except Exception as e:
        print(f"Analysis error: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/feedback', methods=['POST'])
def feedback():
    """Generate detailed feedback based on chat history"""
    try:
        data = request.get_json()
        chat_history = data.get('chat_history', [])
        
        if not chat_history:
            return jsonify({"error": "No chat history provided"}), 400
        
        # Extract user messages for analysis
        user_messages = [msg["text"] for msg in chat_history if msg["sender"] == "User"]
        
        if not user_messages:
            return jsonify({"error": "No user messages found"}), 400
        
        # Generate comprehensive feedback
        feedback = generate_comprehensive_feedback(user_messages)
        
        return jsonify({
            "feedback": feedback,
            "success": True
        })
    
    except Exception as e:
        print(f"Feedback error: {e}")
        return jsonify({"error": str(e)}), 500

def generate_comprehensive_feedback(user_messages):
    """Generate comprehensive feedback based on user messages"""
    feedback_parts = []
    
    feedback_parts.append("📊 Detailed Speech Analysis")
    feedback_parts.append("=" * 40)
    
    # Analyze message patterns
    total_messages = len(user_messages)
    total_words = sum(len(msg.split()) for msg in user_messages)
    avg_words = total_words / max(total_messages, 1)
    
    feedback_parts.append(f"\n📈 Session Statistics:")
    feedback_parts.append(f"• Total speech samples: {total_messages}")
    feedback_parts.append(f"• Average words per sample: {avg_words:.1f}")
    
    # Pronunciation tips
    feedback_parts.append(f"\n🎯 Pronunciation Tips:")
    feedback_parts.append("• Practice speaking at a moderate pace")
    feedback_parts.append("• Focus on clear articulation of each word")
    feedback_parts.append("• Pay attention to word endings and stress patterns")
    
    # Common improvement areas
    feedback_parts.append(f"\n💡 Areas for Improvement:")
    feedback_parts.append("• Vowel sounds: Practice long and short vowel distinctions")
    feedback_parts.append("• Consonant clusters: Work on difficult sound combinations")
    feedback_parts.append("• Intonation: Vary your pitch to sound more natural")
    
    # Encouragement
    feedback_parts.append(f"\n🌟 Keep Going!")
    feedback_parts.append("Regular practice is the key to improvement. Try recording yourself")
    feedback_parts.append("reading different types of texts to build confidence.")
    
    return "\n".join(feedback_parts)

@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({
        "status": "healthy",
        "models_loaded": whisper_model is not None and wav2vec2_model is not None
    })

if __name__ == '__main__':
    print("Starting Python Speech Analysis API...")
    load_models()
    app.run(host='0.0.0.0', port=5000, debug=True) 