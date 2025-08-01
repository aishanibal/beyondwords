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
from gemini_client import get_conversational_response, get_detailed_feedback, get_text_suggestions, get_translation, is_gemini_ready, get_short_feedback, get_detailed_breakdown, create_tutor, get_quick_translation
# from dotenv import load_dotenv
# load_dotenv()

# NOTE: Whisper doesn't natively support Odia ('or'). We map it to Bengali ('bn') 
# as they are linguistically similar and Bengali is supported by Whisper.
# This provides much better transcription accuracy than auto-detection.

app = Flask(__name__)
CORS(app)

# Check API key at startup
api_key = os.getenv("GOOGLE_API_KEY")
if not api_key:
    print("⚠️ WARNING: GOOGLE_API_KEY environment variable is not set!")
    print("   The AI features will not work. Please set your API key:")
    print("   export GOOGLE_API_KEY='your-api-key-here'")
    print("   Then restart this server.")
else:
    print(f"✅ Google API key is configured (starts with: {api_key[:8]}...)")

# Global variables for models
whisper_model = None
wav2vec2_processors = {}
wav2vec2_models = {}

SUPPORTED_WAV2VEC2 = {
    'en': 'facebook/wav2vec2-base-960h',
    'es': 'jonatasgrosman/wav2vec2-large-xlsr-53-spanish',
}

SUPPORTED_LANGUAGES = ['en', 'es', 'hi', 'ja', 'ko', 'zh', 'ar', 'ta', 'or', 'ml', 'fr', 'tl']

def load_models():
    """Load sendgnition models"""
    global whisper_model, wav2vec2_processors, wav2vec2_models
    print("Loading Whisper model...")
    whisper_model = whisper.load_model("large")  # Using large model for better Tagalog accuracy
    for lang, model_name in SUPPORTED_WAV2VEC2.items():
        print(f"Loading Wav2Vec2 model for {lang} ({model_name})...")
        wav2vec2_processors[lang] = Wav2Vec2Processor.from_pretrained(model_name)
        wav2vec2_models[lang] = Wav2Vec2ForCTC.from_pretrained(model_name)
    print("All models loaded successfully!")

def get_whisper_language_code(language):
    """Map application language codes to Whisper-supported language codes"""
    # Whisper language mapping
    language_mapping = {
        'tl': 'tl',  # Tagalog - Whisper supports 'tl' for Tagalog
        'en': 'en',  # English
        'es': 'es',  # Spanish
        'hi': 'hi',  # Hindi
        'ja': 'ja',  # Japanese
        'ko': 'ko',  # Korean
        'zh': 'zh',  # Chinese
        'ar': 'ar',  # Arabic
        'ta': 'ta',  # Tamil
        'or': 'bn',  # Odia - use Bengali as closest supported language
        'ml': 'ml',  # Malayalam
        'fr': 'fr',  # French
    }
    return language_mapping.get(language, None)  # Return None for auto-detection

def transcribe_audio(audio_path, language=None):
    """Transcribe audio using Whisper with optional language specification"""
    try:
        whisper_lang = get_whisper_language_code(language) if language else None
        
        if whisper_lang:
            print(f"Using Whisper with language: {whisper_lang} (from app language: {language})")
            result = whisper_model.transcribe(audio_path, language=whisper_lang)
        else:
            print("Using Whisper with auto-detection")
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
        whisper_lang = get_whisper_language_code(language)
        if whisper_lang:
            reference_text_whisper = whisper_model.transcribe(audio_path, language=whisper_lang)["text"].strip().lower()
        else:
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
    """FAST: Transcribe audio and get quick Gemini response"""
    try:
        data = request.get_json()
        audio_file = data.get('audio_file')
        chat_history = data.get('chat_history', [])
        language = data.get('language', 'en')
        user_level = data.get('user_level', 'beginner')
        user_topics = data.get('user_topics', [])
        user_goals = data.get('user_goals', [])
        formality = data.get('formality', 'friendly')
        feedback_language = data.get('feedback_language', 'en')
        print(f"=== /transcribe called ===")
        print(f"Language received: {language}")
        print(f"Audio file: {audio_file}")
        print(f"Chat history length: {len(chat_history)})")
        print(f"Formality: {formality}")
        print(f"User goals: {user_goals}")
        print(f"Full request data: {data}")
        if not audio_file or not os.path.exists(audio_file):
            return jsonify({"error": "Audio file not found"}), 400
        # Get transcription using Whisper (with language)
        print(f"Calling Whisper with language={language}")
        whisper_lang = get_whisper_language_code(language)
        print(f"Whisper language code: {whisper_lang}")
        
        if whisper_lang:
            # Force language for better accuracy, especially for less common languages like Odia
            if language == 'or':
                print(f"Odia detected - using Bengali (bn) as closest supported language")
            transcription = whisper_model.transcribe(audio_file, language=whisper_lang)["text"]
            print(f"Used forced language: {whisper_lang}")
        else:
            transcription = whisper_model.transcribe(audio_file)["text"]
            print(f"Used auto-detection")
        print(f"Whisper transcription: '{transcription}'")
        print(f"Calling Gemini with language={language}, level={user_level}, goals={user_topics}, formality={formality}")
        ai_response = get_conversational_response(transcription, chat_history, language, user_level, user_topics, formality, feedback_language, user_goals)
        if not ai_response or not str(ai_response).strip():
            if not os.getenv('GOOGLE_API_KEY'):
                ai_response = "AI is not available: Gemini API key is not configured."
            else:
                ai_response = "Hello! What would you like to talk about today?"
        print(f"DEBUG: Outgoing ai_response: {ai_response}")
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
        subgoal_instructions = data.get('subgoal_instructions', '')
        
        print(f"=== /analyze called ===")
        print(f"Language received: {language}")
        print(f"Audio file: {audio_file}")
        print(f"Reference text: {reference_text}")
        print(f"Chat history length: {len(chat_history)}")
        print(f"Subgoal instructions: {subgoal_instructions}")
        
        if not audio_file or not os.path.exists(audio_file):
            return jsonify({"error": "Audio file not found"}), 400
        
        # Use Whisper for reference text if not provided
        if not reference_text:
            print(f"Getting reference text with Whisper (language={language})")
            whisper_lang = get_whisper_language_code(language)
            print(f"Whisper language code: {whisper_lang}")
            if whisper_lang:
                if language == 'or':
                    print(f"Odia detected - using Bengali (bn) as closest supported language")
                reference_text = whisper_model.transcribe(audio_file, language=whisper_lang)["text"]
                print(f"Used forced language: {whisper_lang}")
            else:
                reference_text = whisper_model.transcribe(audio_file)["text"]
                print(f"Used auto-detection")
            print(f"Whisper reference text: '{reference_text}'")
        
        # Wav2Vec2 analysis (if supported)
        print(f"Calling Wav2Vec2 analysis with language={language}")
        analysis_result = analyze_speech_with_wav2vec2(audio_file, reference_text, language=language)
        
        # Get user data for personalized feedback
        user_level = data.get('user_level', 'beginner')
        user_topics = data.get('user_topics', [])
        
        # Detailed feedback from Gemini
        print(f"Calling Gemini detailed feedback with language={language}, level={user_level}")
        feedback = get_detailed_feedback(
            analysis_result.get('analysis', ''),
            reference_text,
            analysis_result.get('transcription', ''),
            chat_history,
            language,
            user_level,
            user_topics,
            feedback_language='en',
            description=None,
            romanization_display=None
        )
        print(f"Gemini detailed feedback: '{feedback[:100]}...'")
        
        return jsonify({
            "transcription": analysis_result.get('transcription', ''),
            "reference": reference_text,
            "analysis": analysis_result.get('analysis', ''),
            "feedback": feedback
        })
    except Exception as e:
        print(f"Analysis error: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/conversation_summary', methods=['POST'])
def conversation_summary():
    """Generate conversation summary and progress evaluation using Gemini."""
    try:
        data = request.get_json()
        chat_history = data.get('chat_history', [])
        subgoal_instructions = data.get('subgoal_instructions', '')
        user_topics = data.get('user_topics', [])
        
        print(f"Chat history length: {len(chat_history)}")
        print(f"Subgoal instructions: {subgoal_instructions}")
        print(f"User topics: {user_topics}")
        
        # Check if there are any user messages in the chat history
        user_messages = [msg for msg in chat_history if msg.get('sender') == 'User']
        if not user_messages:
            print("No user messages found in chat history, skipping evaluation")
            return jsonify({
                "title": "No Evaluation",
                "synopsis": "No user messages to evaluate.",
                "progress_percentages": None
            })
        
        from gemini_client import generate_conversation_summary
        summary = generate_conversation_summary(chat_history, subgoal_instructions, user_topics)
        
        print(f"Generated summary: {summary}")
        return jsonify(summary)
    except Exception as e:
        print(f"Conversation summary error: {e}")
        import traceback
        traceback.print_exc()
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
        api_key_set = bool(os.getenv("GOOGLE_API_KEY"))
        gemini_ready = is_gemini_ready() if api_key_set else False
        
        return jsonify({
            "status": "healthy" if all_models_loaded and gemini_ready else "degraded",
            "models_loaded": all_models_loaded,
            "models_status": models_status,
            "api_key_configured": api_key_set,
            "gemini_ready": gemini_ready,
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
        feedback_language = data.get('feedback_language', 'en')
        romanization_display = data.get('romanization_display', None)

        print(f"=== /feedback called ===")
        print(f"Language: {language}")
        print(f"Last transcription: {last_transcription}")
        print(f"Chat history length: {len(chat_history)}")

        # Call AI client for detailed feedback using Gemini
        response = get_detailed_feedback(
            phoneme_analysis="",  # Placeholder for future phoneme analysis
            reference_text="",    # Placeholder for future reference text
            recognized_text=last_transcription,
            chat_history=chat_history,
            language=language,
            user_level=user_level,
            user_topics=user_topics,
            feedback_language=feedback_language,
            description=None,
            romanization_display=romanization_display
        )
        print(f"AI feedback received: {response[:100]}...")
        return jsonify({"feedback": response})
    except Exception as e:
        print(f"Feedback error: {e}")
        return jsonify({"feedback": "Error generating feedback.", "error": str(e)}), 500

@app.route('/short_feedback', methods=['POST'])
def short_feedback():
    try:
        data = request.get_json()
        user_input = data.get('user_input', '')
        context = data.get('context', '')
        language = data.get('language', 'en')
        user_level = data.get('user_level', 'beginner')
        user_topics = data.get('user_topics', [])
        user_goals = data.get('user_goals', [])
        feedback_language = data.get('feedback_language', 'en')
        description = data.get('description', None)
        feedback = get_short_feedback(user_input, context, language, user_level, user_topics, feedback_language, user_goals, description)
        return jsonify({"short_feedback": feedback})
    except Exception as e:
        print(f"Short feedback error: {e}")
        return jsonify({"short_feedback": "Error generating feedback.", "error": str(e)}), 500

@app.route('/initial_message', methods=['POST'])
def initial_message():
    """Generate an initial AI greeting message for a new conversation"""
    try:
        data = request.get_json()
        chat_history = data.get('chat_history', [])
        language = data.get('language', 'en')
        user_level = data.get('user_level', 'beginner')
        user_topics = data.get('user_topics', [])
        user_goals = data.get('user_goals', [])
        formality = data.get('formality', 'friendly')
        feedback_language = data.get('feedback_language', 'en')
        description = data.get('description', None)
        
        print(f"=== /initial_message called ===")
        print(f"Language: {language}")
        print(f"User level: {user_level}")
        print(f"User topics: {user_topics}")
        print(f"User goals: {user_goals}")
        print(f"Formality: {formality}")
        print(f"Full request data: {data}")
        
        # Generate a welcoming initial message
        ai_response = get_conversational_response("", chat_history, language, user_level, user_topics, formality, feedback_language, user_goals, description)
        
        if not ai_response or not str(ai_response).strip():
            if not os.getenv('GOOGLE_API_KEY'):
                ai_response = "AI is not available: Gemini API key is not configured."
            else:
                ai_response = "Hello! What would you like to talk about today?"
        
        print(f"Initial AI message: {ai_response}")
        return jsonify({"ai_response": ai_response})
    except Exception as e:
        print(f"Initial message error: {e}")
        return jsonify({"ai_response": "Hello! What would you like to talk about today?"}), 500

@app.route('/suggestions', methods=['POST'])
def suggestions():
    """Generate 3 contextual text suggestions for what to say next"""
    try:
        data = request.get_json()
        print(f"=== /suggestions called ===")
        print(f"Request data: {data}")
        
        # Handle both frontend format (conversationId) and direct chat_history
        conversation_id = data.get('conversationId')
        chat_history = data.get('chat_history', [])
        language = data.get('language', 'en')
        user_level = data.get('user_level', 'beginner')
        user_topics = data.get('user_topics', [])
        user_goals = data.get('user_goals', [])
        formality = data.get('formality', 'friendly')
        feedback_language = data.get('feedback_language', 'en')
        description = data.get('description', None)

        # If conversationId is provided but no chat_history, fetch from database
        if conversation_id and not chat_history:
            try:
                conversation_data = getConversationWithMessages(conversation_id)
                if conversation_data and 'messages' in conversation_data:
                    # Convert database messages to chat_history format
                    chat_history = []
                    for msg in conversation_data['messages']:
                        chat_history.append({
                            'sender': 'User' if msg.get('sender') == 'user' else 'Tutor',
                            'text': msg.get('content', '')
                        })
                print(f"Fetched {len(chat_history)} messages from conversation {conversation_id}")
            except Exception as e:
                print(f"Error fetching conversation {conversation_id}: {e}")
                chat_history = []

        print(f"Language: {language}")
        print(f"User level: {user_level}")
        print(f"User topics: {user_topics}")
        print(f"User goals: {user_goals}")
        print(f"Chat history length: {len(chat_history)}")

        # Call AI client for suggestions using Gemini
        print(f"Calling get_text_suggestions with: language={language}, history_len={len(chat_history)}")
        suggestions = get_text_suggestions(chat_history, language, user_level, user_topics, formality, feedback_language, user_goals, description)
        print(f"Generated {len(suggestions)} suggestions: {suggestions}")
        
        # Ensure suggestions is a list and format properly for frontend
        if not isinstance(suggestions, list):
            suggestions = [str(suggestions)]
        
        response_data = {"suggestions": suggestions}
        print(f"Returning response: {response_data}")
        return jsonify(response_data)
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
        feedback_language = data.get('feedback_language', 'en')

        print(f"=== /translate called ===")
        print(f"Text: {text}")
        print(f"Source language: {source_language}")
        print(f"Target language: {target_language}")
        print(f"Breakdown: {breakdown}")

        if not text:
            return jsonify({"error": "No text provided"}), 400

        # Call AI client for translation
        translation_result = get_translation(text, source_language, target_language, breakdown, feedback_language)
        print(f"Translation result: {translation_result.get('translation', '')}")
        
        return jsonify(translation_result)
    except Exception as e:
        print(f"Translation error: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/detailed_breakdown', methods=['POST'])
def detailed_breakdown():
    """Get detailed breakdown of an AI response using explain_llm_response"""
    try:
        data = request.get_json()
        llm_response = data.get('llm_response', '')
        user_input = data.get('user_input', '')
        context = data.get('context', '')
        language = data.get('language', 'en')
        user_level = data.get('user_level', 'beginner')
        user_topics = data.get('user_topics', [])
        user_goals = data.get('user_goals', [])
        formality = data.get('formality', 'friendly')
        feedback_language = data.get('feedback_language', 'en')
        description = data.get('description', None)
        
        print(f"=== /detailed_breakdown called ===")
        print(f"Language: {language}")
        print(f"User level: {user_level}")
        print(f"User topics: {user_topics}")
        print(f"User goals: {user_goals}")
        print(f"Formality: {formality}")
        print(f"LLM response length: {len(llm_response)}")
        
        if not llm_response:
            return jsonify({"error": "No LLM response provided"}), 400
        
        # Call AI client for detailed breakdown
        breakdown = get_detailed_breakdown(llm_response, user_input, context, language, user_level, user_topics, formality, feedback_language, user_goals, description)
        print(f"Generated detailed breakdown: {breakdown[:100]}...")
        
        return jsonify({"breakdown": breakdown})
    except Exception as e:
        print(f"Detailed breakdown error: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/explain_suggestion', methods=['POST'])
def explain_suggestion():
    """Explain a specific suggestion with translation and detailed explanation"""
    try:
        data = request.get_json()
        suggestion_text = data.get('suggestion_text', '')
        chat_history = data.get('chatHistory', [])
        language = data.get('language', 'en')
        user_level = data.get('user_level', 'beginner')
        user_topics = data.get('user_topics', [])
        formality = data.get('formality', 'friendly')
        feedback_language = data.get('feedback_language', 'en')
        user_goals = data.get('user_goals', [])
        description = data.get('description', None)
        
        print(f"=== /explain_suggestion called ===")
        print(f"Suggestion text: {suggestion_text}")
        print(f"Language: {language}")
        print(f"User level: {user_level}")
        print(f"User topics: {user_topics}")
        print(f"User goals: {user_goals}")
        print(f"Formality: {formality}")
        print(f"Chat history length: {len(chat_history)}")
        
        if not suggestion_text:
            return jsonify({"error": "No suggestion text provided"}), 400
        
        # Create tutor instance and call explain_suggestion method directly
        print(f"[DEBUG] Creating tutor for language: {language}, level: {user_level}")
        tutor = create_tutor(language, user_level, user_topics)
        tutor.feedback_language = feedback_language
        tutor.user_closeness = formality
        tutor.user_goals = user_goals
        
        # Build context from chat history
        context = ""
        if chat_history:
            context = "\n".join([f"{msg.get('sender', 'Unknown')}: {msg.get('text', '')}" for msg in chat_history[-4:]])
        
        print(f"[DEBUG] Calling tutor.explain_suggestion() with text: '{suggestion_text}'")
        explanation_result = tutor.explain_suggestion(suggestion_text, context, description)
        print(f"[DEBUG] explain_suggestion() returned: {explanation_result}")
        
        return jsonify(explanation_result)
    except Exception as e:
        print(f"Explain suggestion error: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/quick_translation', methods=['POST'])
def quick_translation():
    """Get quick translation of AI message with word-by-word breakdown"""
    try:
        data = request.get_json()
        ai_message = data.get('ai_message', '')
        language = data.get('language', 'en')
        user_level = data.get('user_level', 'beginner')
        user_topics = data.get('user_topics', [])
        formality = data.get('formality', 'friendly')
        feedback_language = data.get('feedback_language', 'en')
        user_goals = data.get('user_goals', [])
        description = data.get('description', None)
        
        print(f"=== /quick_translation called ===")
        print(f"AI message: {ai_message}")
        print(f"Language: {language}")
        print(f"User level: {user_level}")
        print(f"User topics: {user_topics}")
        print(f"User goals: {user_goals}")
        print(f"Formality: {formality}")
        
        if not ai_message:
            return jsonify({"error": "No AI message provided"}), 400
        
        # Call AI client for quick translation
        translation_result = get_quick_translation(ai_message, language, user_level, user_topics, formality, feedback_language, user_goals, description)
        print(f"Generated quick translation length: {len(translation_result)}")
        print(f"Generated quick translation: {translation_result}")
        
        return jsonify({"translation": translation_result})
    except Exception as e:
        print(f"Quick translation error: {e}")
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    print("Starting Python Speech Analysis API...")
    load_models()
    app.run(host='0.0.0.0', port=5000, debug=True) 