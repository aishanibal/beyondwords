from flask import Flask, request, jsonify, render_template, redirect, url_for, session
from flask_cors import CORS
import os
import json
import subprocess
import tempfile
import shutil
from werkzeug.utils import secure_filename
import numpy as np
import datetime
from gemini_client import get_conversational_response, get_detailed_feedback, get_text_suggestions, get_translation, is_gemini_ready, get_short_feedback, get_detailed_breakdown, create_tutor, get_quick_translation
from tts_synthesizer_admin_controlled import synthesize_speech

# Use Gemini for transcription
from gemini_transcription import transcribe_audio_gemini, transcribe_audio_with_analysis_gemini
print("🤖 Using Gemini for transcription")
# from dotenv import load_dotenv
# load_dotenv()

# NOTE: Whisper doesn't natively support Odia ('or'). We map it to Bengali ('bn') 
# as they are linguistically similar and Bengali is supported by Whisper.
# This provides much better transcription accuracy than auto-detection.

app = Flask(__name__)
app.secret_key = os.urandom(24)  # For session management
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

SUPPORTED_LANGUAGES = ['en', 'es', 'hi', 'ja', 'ko', 'zh', 'ar', 'ta', 'or', 'ml', 'fr', 'tl']

def load_models():
    """Load speech recognition models"""
    
    # Gemini transcriber is loaded on-demand
    print("✅ Gemini transcriber will be loaded on-demand")
    
    print("All models loaded successfully!")



def transcribe_audio(audio_path, language=None):
    """Transcribe audio using Gemini"""
    try:
        print(f"Using Gemini with language: {language}")
        result = transcribe_audio_gemini(audio_path, language or 'en')
        return result if result else ""
    except Exception as e:
        print(f"Transcription error: {e}")
        return ""

def analyze_speech_with_gemini(audio_path, reference_text, language='en'):
    """Analyze speech using Gemini and provide feedback"""
    language = language if language in SUPPORTED_LANGUAGES else 'en'
    try:
        # Get transcription using Gemini
        print(f"Getting transcription using Gemini for language: {language}")
        transcription = transcribe_audio_gemini(audio_path, language)
        
        if not transcription:
            return {
                "transcription": "",
                "reference": reference_text,
                "analysis": "Error: Could not transcribe audio file."
            }
        
        # Simple analysis using Gemini
        analysis = f"Transcription: {transcription}\nReference: {reference_text}\nLanguage: {language}"
        
        return {
            "transcription": transcription,
            "reference": reference_text,
            "analysis": analysis
        }
        
    except Exception as e:
        print(f"Error in analyze_speech_with_gemini: {e}")
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
        # Get transcription using Gemini (with language)
        print(f"Calling Gemini with language={language}")
        transcription = transcribe_audio_gemini(audio_file, language)
        print(f"Gemini transcription: '{transcription}'")
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

@app.route('/transcribe_only', methods=['POST'])
def transcribe_only():
    """FAST: Transcribe audio only (no AI response)"""
    try:
        # Handle both JSON and form data
        if request.is_json:
            data = request.get_json()
            audio_file = data.get('audio_file')
            language_raw = data.get('language', 'en')
            # Handle case where language might be a list or other type
            if isinstance(language_raw, list):
                language = language_raw[0] if language_raw else 'en'
            else:
                language = str(language_raw) if language_raw else 'en'
        else:
            # Handle form data (like the current /transcribe endpoint)
            audio_file = request.form.get('audio_file')
            language_raw = request.form.get('language', 'en')
            # Handle case where language might be a list or other type
            if isinstance(language_raw, list):
                language = language_raw[0] if language_raw else 'en'
            else:
                language = str(language_raw) if language_raw else 'en'
            
        print(f"=== /transcribe_only called ===")
        print(f"Language received: {language}")
        print(f"Language type: {type(language)}")
        print(f"Audio file: {audio_file}")
        print(f"Request content type: {request.content_type}")
        print(f"Request is JSON: {request.is_json}")
        if request.is_json:
            print(f"JSON data: {request.get_json()}")
        else:
            print(f"Form data: {dict(request.form)}")
        
        if not audio_file or not os.path.exists(audio_file):
            return jsonify({"error": "Audio file not found"}), 400
        
        # Get transcription using Gemini (with language)
        print(f"Calling Gemini with language={language}")
        transcription = transcribe_audio_gemini(audio_file, language)
        print(f"Gemini transcription: '{transcription}'")
        print(f"Transcription length: {len(transcription)}")
        print(f"Transcription is empty: {not transcription.strip()}")
        
        # If transcription is empty, try to get more info
        if not transcription.strip():
            print("WARNING: Transcription is empty!")
            print(f"Audio file exists: {os.path.exists(audio_file)}")
            if os.path.exists(audio_file):
                file_size = os.path.getsize(audio_file)
                print(f"Audio file size: {file_size} bytes")
        
        return jsonify({
            "transcription": transcription
        })
    except Exception as e:
        print(f"Transcription error: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/ai_response', methods=['POST'])
def ai_response():
    """Get AI response for given transcription"""
    try:
        data = request.get_json()
        transcription = data.get('transcription')
        chat_history = data.get('chat_history', [])
        language = data.get('language', 'en')
        user_level = data.get('user_level', 'beginner')
        user_topics = data.get('user_topics', [])
        user_goals = data.get('user_goals', [])
        formality = data.get('formality', 'friendly')
        feedback_language = data.get('feedback_language', 'en')
        
        print(f"=== /ai_response called ===")
        print(f"Transcription: {transcription}")
        print(f"Language: {language}")
        print(f"Chat history length: {len(chat_history)}")
        print(f"Formality: {formality}")
        print(f"User goals: {user_goals}")
        
        if not transcription:
            return jsonify({"error": "No transcription provided"}), 400
        
        print(f"Calling Gemini with language={language}, level={user_level}, goals={user_topics}, formality={formality}")
        ai_response = get_conversational_response(transcription, chat_history, language, user_level, user_topics, formality, feedback_language, user_goals)
        if not ai_response or not str(ai_response).strip():
            if not os.getenv('GOOGLE_API_KEY'):
                ai_response = "AI is not available: Gemini API key is not configured."
            else:
                ai_response = "Hello! What would you like to talk about today?"
        print(f"DEBUG: Outgoing ai_response: {ai_response}")
        
        return jsonify({
            "ai_response": ai_response
        })
    except Exception as e:
        print(f"AI response error: {e}")
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
        
        # Use Gemini for reference text if not provided
        if not reference_text:
            print(f"Getting reference text with Gemini (language={language})")
            reference_text = transcribe_audio_gemini(audio_file, language)
            print(f"Gemini reference text: '{reference_text}'")
        
        # Gemini analysis
        print(f"Calling Gemini analysis with language={language}")
        analysis_result = analyze_speech_with_gemini(audio_file, reference_text, language=language)
        
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
        target_language = data.get('target_language', 'en')
        feedback_language = data.get('feedback_language', 'en')
        is_continued_conversation = data.get('is_continued_conversation', False)
        
        print(f"Chat history length: {len(chat_history)}")
        print(f"Subgoal instructions: {subgoal_instructions}")
        print(f"User topics: {user_topics}")
        print(f"Target language: {target_language}")
        print(f"Feedback language: {feedback_language}")
        print(f"Is continued conversation: {is_continued_conversation}")
        
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
        summary = generate_conversation_summary(chat_history, subgoal_instructions, user_topics, target_language, feedback_language, is_continued_conversation)
        
        print(f"Generated summary: {summary}")
        print(f"Summary keys: {list(summary.keys()) if summary else 'None'}")
        print(f"Progress percentages in summary: {summary.get('progress_percentages', 'Not found')}")
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
        # Check transcription method
        transcription_method = "Gemini"
        
        models_status = {
            "gemini_transcriber": True
        }
        
        # Using Gemini for transcription (no local models needed)
        all_models_loaded = True  # No local models needed for Gemini transcription
            
        api_key_set = bool(os.getenv("GOOGLE_API_KEY"))
        gemini_ready = is_gemini_ready() if api_key_set else False
        
        return jsonify({
            "status": "healthy" if all_models_loaded and gemini_ready else "degraded",
            "transcription_method": transcription_method,
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

@app.route('/generate_tts', methods=['POST'])
def generate_tts():
    """Generate text-to-speech using Gemini TTS API"""
    try:
        data = request.get_json()
        text = data.get('text', '')
        language_code = data.get('language_code', 'en')
        output_path = data.get('output_path', 'tts_output/gemini_response.mp3')
        
        print(f"=== /generate_tts called ===")
        print(f"Text length: {len(text)}")
        print(f"Language code: {language_code}")
        print(f"Output path: {output_path}")
        
        if not text:
            return jsonify({"error": "No text provided"}), 400
        
        # Generate TTS using the new synthesizer (Gemini + fallback)
        print(f"🔍 Calling synthesize_speech with: text='{text[:50]}...', language_code='{language_code}', output_path='{output_path}'")
        result_path = synthesize_speech(text, language_code, output_path)
        
        if result_path:
            print(f"✅ TTS generated successfully: {result_path}")
            return jsonify({
                "success": True,
                "output_path": result_path,
                "message": "TTS generated successfully"
            })
        else:
            print("❌ TTS generation failed - synthesize_speech returned None")
            return jsonify({
                "success": False,
                "error": "Failed to generate TTS"
            }), 500
            
    except Exception as e:
        print(f"TTS generation error: {e}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

# Admin Dashboard Routes
from admin_dashboard import AdminDashboard
dashboard = AdminDashboard()

@app.route('/admin')
def admin_index():
    """Main admin dashboard page"""
    settings = dashboard.get_tts_settings()
    usage_stats = dashboard.get_usage_stats()
    
    return render_template('admin_dashboard.html', 
                         settings=settings,
                         usage_stats=usage_stats)

@app.route('/admin/login', methods=['GET', 'POST'])
def admin_login():
    """Admin login page"""
    if request.method == 'POST':
        password = request.form.get('password')
        if dashboard.verify_password(password):
            session['admin_logged_in'] = True
            return redirect(url_for('admin_index'))
        else:
            return render_template('login.html', error="Invalid password")
    
    return render_template('login.html')

@app.route('/admin/logout')
def admin_logout():
    """Admin logout"""
    session.pop('admin_logged_in', None)
    return redirect(url_for('admin_login'))

@app.route('/admin/api/status')
def admin_api_status():
    """Get system status as JSON"""
    if 'admin_logged_in' not in session:
        return jsonify({"error": "Not authenticated"}), 401
    
    return jsonify({
        "status": dashboard.get_system_status(),
        "stats": dashboard.get_usage_stats(),
        "settings": dashboard.get_tts_settings()
    })

@app.route('/admin/api/enable_gemini', methods=['POST'])
def admin_api_enable_gemini():
    """Enable Gemini TTS"""
    if 'admin_logged_in' not in session:
        return jsonify({"error": "Not authenticated"}), 401
    
    data = request.get_json()
    password = data.get('password')
    
    if dashboard.enable_gemini_tts(password):
        return jsonify({"success": True, "message": "Gemini TTS enabled"})
    else:
        return jsonify({"success": False, "message": "Invalid password"})

@app.route('/admin/api/disable_gemini', methods=['POST'])
def admin_api_disable_gemini():
    """Disable Gemini TTS"""
    if 'admin_logged_in' not in session:
        return jsonify({"error": "Not authenticated"}), 401
    
    data = request.get_json()
    password = data.get('password')
    
    if dashboard.disable_gemini_tts(password):
        return jsonify({"success": True, "message": "Gemini TTS disabled"})
    else:
        return jsonify({"success": False, "message": "Invalid password"})

@app.route('/admin/api/update_settings', methods=['POST'])
def admin_api_update_settings():
    """Update TTS settings"""
    if 'admin_logged_in' not in session:
        return jsonify({"error": "Not authenticated"}), 401
    
    data = request.get_json()
    settings = data.get('settings', {})
    
    if dashboard.update_tts_settings(settings):
        return jsonify({"success": True, "message": "Settings updated"})
    else:
        return jsonify({"success": False, "message": "Failed to update settings"})

@app.route('/admin/api/reset_usage', methods=['POST'])
def admin_api_reset_usage():
    """Reset daily usage"""
    if 'admin_logged_in' not in session:
        return jsonify({"error": "Not authenticated"}), 401
    
    dashboard.reset_daily_usage()
    return jsonify({"success": True, "message": "Usage reset"})

@app.route('/admin/api/set_tts_system', methods=['POST'])
def admin_api_set_tts_system():
    """Set the active TTS system"""
    data = request.get_json()
    system = data.get('system')
    
    if system not in ['system', 'cloud', 'gemini']:
        return jsonify({"success": False, "message": "Invalid TTS system"})
    
    dashboard.update_tts_settings({"active_tts": system})
    return jsonify({"success": True, "message": f"TTS system changed to {system.upper()}"})

@app.route('/admin/api/change_password', methods=['POST'])
def admin_api_change_password():
    """Change admin password"""
    if 'admin_logged_in' not in session:
        return jsonify({"error": "Not authenticated"}), 401
    
    data = request.get_json()
    old_password = data.get('old_password')
    new_password = data.get('new_password')
    
    if dashboard.change_password(old_password, new_password):
        return jsonify({"success": True, "message": "Password changed"})
    else:
        return jsonify({"success": False, "message": "Invalid current password"})

if __name__ == '__main__':
    print("Starting Python Speech Analysis API...")
    print("🔐 Admin Dashboard: http://localhost:5000/admin")
    print("🔑 Default password: admin123")
    load_models()
    app.run(host='0.0.0.0', port=5000, debug=True) 