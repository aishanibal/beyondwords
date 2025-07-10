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
import datetime
from gemini_client import get_conversational_response, get_detailed_feedback, get_text_suggestions, get_translation, is_ollama_ready

app = Flask(__name__)
CORS(app)

# Global variables for models
whisper_model = None
wav2vec2_processors = {}
wav2vec2_models = {}

SUPPORTED_WAV2VEC2 = {
    'en': 'facebook/wav2vec2-base-960h',
    'es': 'jonatasgrosman/wav2vec2-large-xlsr-53-spanish',
}

SUPPORTED_LANGUAGES = ['en', 'es', 'hi', 'ja']

def load_models():
    """Load sendgnition models"""
    global whisper_model, wav2vec2_processors, wav2vec2_models
    print("Loading Whisper model...")
    whisper_model = whisper.load_model("base")  # Changed from "large" to "base" for speed
    for lang, model_name in SUPPORTED_WAV2VEC2.items():
        print(f"Loading Wav2Vec2 model for {lang} ({model_name})...")
        wav2vec2_processors[lang] = Wav2Vec2Processor.from_pretrained(model_name)
        wav2vec2_models[lang] = Wav2Vec2ForCTC.from_pretrained(model_name)
    print("All models loaded successfully!")

def transcribe_audio(audio_path):
    """Transcribe audio using Whisper"""
    try:
        result = whisper_model.transcribe(audio_path)
        return result["text"]
    except Exception as e:
        print(f"Whisper transcription error: {e}")
        return ""

def analyze_speech_with_wav2vec2(audio_path, reference_text, language='en'):
    """Analyze speech using Wav2Vec2 and provide feedback"""
    language = language if language in SUPPORTED_LANGUAGES else 'en'
    if language in ['hi', 'ja']:
        return {
            "transcription": "",
            "reference": reference_text,
            "analysis": f"Wav2Vec2 phoneme-level analysis is not yet supported for {language.upper()}. Only Whisper transcription is available."
        }
    wav2vec2_processor = wav2vec2_processors.get(language, wav2vec2_processors['en'])
    wav2vec2_model = wav2vec2_models.get(language, wav2vec2_models['en'])
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
        reference_text_whisper = whisper_model.transcribe(audio_path, language=language)["text"].strip().lower()
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
                espeak_lang = {'en': 'en', 'es': 'es'}.get(language, 'en')
                cmd = ["espeak", "-q", "--ipa=3", f"-v{espeak_lang}", text]
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

@app.route('/transcribe', methods=['POST'])
def transcribe():
    """FAST: Transcribe audio and get quick Ollama response"""
    try:
        data = request.get_json()
        audio_file = data.get('audio_file')
        chat_history = data.get('chat_history', [])
        language = data.get('language', 'en')
        user_level = data.get('user_level', 'beginner')
        user_topics = data.get('user_topics', [])
        
        print(f"=== /transcribe called ===")
        print(f"Language received: {language}")
        print(f"Audio file: {audio_file}")
        print(f"Chat history length: {len(chat_history)}")
        
        if not audio_file or not os.path.exists(audio_file):
            return jsonify({"error": "Audio file not found"}), 400
        
        # Get transcription using Whisper (with language)
        print(f"Calling Whisper with language={language}")
        transcription = whisper_model.transcribe(audio_file, language=language)["text"]
        print(f"Whisper transcription: '{transcription}'")
        
        print(f"Calling Ollama with language={language}, level={user_level}, goals={user_topics}")
        ai_response = get_conversational_response(transcription, chat_history, language, user_level, user_topics)
        print(f"Ollama response: '{ai_response}'")
        
        return jsonify({
            "transcription": transcription,
            "ai_response": ai_response
        })
    except Exception as e:
        print(f"Transcription error: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/analyze', methods=['POST'])
def analyze():
    """SLOW: Analyze audio for detailed feedback"""
    try:
        data = request.get_json()
        audio_file = data.get('audio_file')
        reference_text = data.get('reference_text', '')
        chat_history = data.get('chat_history', [])
        language = data.get('language', 'en')
        
        print(f"=== /analyze called ===")
        print(f"Language received: {language}")
        print(f"Audio file: {audio_file}")
        print(f"Reference text: {reference_text}")
        print(f"Chat history length: {len(chat_history)}")
        
        if not audio_file or not os.path.exists(audio_file):
            return jsonify({"error": "Audio file not found"}), 400
        
        # Use Whisper for reference text if not provided
        if not reference_text:
            print(f"Getting reference text with Whisper (language={language})")
            reference_text = whisper_model.transcribe(audio_file, language=language)["text"]
            print(f"Whisper reference text: '{reference_text}'")
        
        # Wav2Vec2 analysis (if supported)
        print(f"Calling Wav2Vec2 analysis with language={language}")
        analysis_result = analyze_speech_with_wav2vec2(audio_file, reference_text, language=language)
        
        # Get user data for personalized feedback
        user_level = data.get('user_level', 'beginner')
        user_topics = data.get('user_topics', [])
        
        # Detailed feedback from Ollama
        print(f"Calling Ollama detailed feedback with language={language}, level={user_level}")
        feedback = get_detailed_feedback(
            analysis_result.get('analysis', ''),
            reference_text,
            analysis_result.get('transcription', ''),
            chat_history,
            language,
            user_level,
            user_topics
        )
        print(f"Ollama detailed feedback: '{feedback[:100]}...'")
        
        return jsonify({
            "transcription": analysis_result.get('transcription', ''),
            "reference": reference_text,
            "analysis": analysis_result.get('analysis', ''),
            "feedback": feedback
        })
    except Exception as e:
        print(f"Analysis error: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint"""
    try:
        models_status = {
            "whisper_model": whisper_model is not None,
            "wav2vec2_processors": all(wav2vec2_processors.values()),
            "wav2vec2_models": all(wav2vec2_models.values())
        }
        
        all_models_loaded = all(models_status.values())
        
        return jsonify({
            "status": "healthy" if all_models_loaded else "degraded",
            "models_loaded": all_models_loaded,
            "models_status": models_status,
            "timestamp": str(datetime.datetime.now())
        })
    except Exception as e:
        return jsonify({
            "status": "error",
            "error": str(e),
            "timestamp": str(datetime.datetime.now())
        }), 500

@app.route('/feedback', methods=['POST'])
def feedback():
    """Generate detailed feedback using Ollama, given chat history and last transcription"""
    try:
        data = request.get_json()
        chat_history = data.get('chat_history', [])
        last_transcription = data.get('last_transcription', '')
        language = data.get('language', 'en')
        user_level = data.get('user_level', 'beginner')
        user_topics = data.get('user_topics', [])

        print(f"=== /feedback called ===")
        print(f"Language: {language}")
        print(f"Last transcription: {last_transcription}")
        print(f"Chat history length: {len(chat_history)}")

        # Call AI client for detailed feedback (scalable for future Gemini integration)
        response = get_detailed_feedback(
            phoneme_analysis="",  # Placeholder for future phoneme analysis
            reference_text="",    # Placeholder for future reference text
            recognized_text=last_transcription,
            chat_history=chat_history,
            language=language,
            user_level=user_level,
            user_topics=user_topics
        )
        print(f"AI feedback received: {response[:100]}...")
        return jsonify({"feedback": response})
    except Exception as e:
        print(f"Feedback error: {e}")
        return jsonify({"feedback": "Error generating feedback.", "error": str(e)}), 500

@app.route('/suggestions', methods=['POST'])
def suggestions():
    """Generate 3 contextual text suggestions for what to say next"""
    try:
        data = request.get_json()
        chat_history = data.get('chat_history', [])
        language = data.get('language', 'en')
        user_level = data.get('user_level', 'beginner')
        user_topics = data.get('user_topics', [])

        print(f"=== /suggestions called ===")
        print(f"Language: {language}")
        print(f"User level: {user_level}")
        print(f"User goals: {user_topics}")
        print(f"Chat history length: {len(chat_history)}")

        # Call AI client for suggestions (scalable for future Gemini integration)
        suggestions = get_text_suggestions(chat_history, language, user_level, user_topics)
        print(f"Generated {len(suggestions)} suggestions")
        
        return jsonify({"suggestions": suggestions})
    except Exception as e:
        print(f"Suggestions error: {e}")
        return jsonify({"suggestions": [], "error": str(e)}), 500

@app.route('/translate', methods=['POST'])
def translate():
    """Translate text with optional detailed breakdown"""
    try:
        data = request.get_json()
        text = data.get('text', '')
        source_language = data.get('source_language', 'auto')
        target_language = data.get('target_language', 'en')
        breakdown = data.get('breakdown', False)

        print(f"=== /translate called ===")
        print(f"Text: {text}")
        print(f"Source language: {source_language}")
        print(f"Target language: {target_language}")
        print(f"Breakdown: {breakdown}")

        if not text:
            return jsonify({"error": "No text provided"}), 400

        # Call AI client for translation
        translation_result = get_translation(text, source_language, target_language, breakdown)
        print(f"Translation result: {translation_result.get('translation', '')}")
        
        return jsonify(translation_result)
    except Exception as e:
        print(f"Translation error: {e}")
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    print("Starting Python Speech Analysis API...")
    load_models()
    app.run(host='0.0.0.0', port=5001, debug=True) 