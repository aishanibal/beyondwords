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
from gemini_client import get_conversational_response, get_detailed_feedback, get_text_suggestions, get_translation, is_gemini_ready, get_short_feedback, get_detailed_breakdown, create_tutor, get_quick_translation, get_quick_translation_hybrid_with_meta
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
        formality = data.get('formality', 'friendly')
        feedback_language = data.get('feedback_language', 'en')
        user_goals = data.get('user_goals', [])
        description = data.get('description', None)
        
        print(f"🎤 Transcribe request - Language: {language}, Level: {user_level}")
        
        # Get transcription
        transcription = transcribe_audio(audio_file, language)
        
        if not transcription:
            return jsonify({
                "error": "Could not transcribe audio",
                "transcription": "",
                "response": ""
            })
        
        print(f"📝 Transcription: {transcription}")
        
        # Get conversational response
        response = get_conversational_response(
            transcription, 
            chat_history, 
            language, 
            user_level, 
            user_topics, 
            formality, 
            feedback_language, 
            user_goals, 
            description
        )
        
        return jsonify({
            "transcription": transcription,
            "response": response,
            "success": True
        })
        
    except Exception as e:
        print(f"❌ Transcribe error: {e}")
        return jsonify({
            "error": str(e),
            "transcription": "",
            "response": ""
        })

@app.route('/transcribe_only', methods=['POST'])
def transcribe_only():
    """Transcribe audio only without AI response"""
    try:
        data = request.get_json()
        audio_file = data.get('audio_file')
        language = data.get('language', 'en')
        
        print(f"🎤 Transcribe only request - Language: {language}")
        
        # Get transcription
        transcription = transcribe_audio(audio_file, language)
        
        if not transcription:
            return jsonify({
                "error": "Could not transcribe audio",
                "transcription": ""
            })
        
        print(f"📝 Transcription: {transcription}")
        
        return jsonify({
            "transcription": transcription,
            "success": True
        })
        
    except Exception as e:
        print(f"❌ Transcribe only error: {e}")
        return jsonify({
            "error": str(e),
            "transcription": ""
        })

@app.route('/ai_response', methods=['POST'])
def ai_response():
    """Get AI response for text input"""
    try:
        data = request.get_json()
        user_input = data.get('user_input', '')
        chat_history = data.get('chat_history', [])
        language = data.get('language', 'en')
        user_level = data.get('user_level', 'beginner')
        user_topics = data.get('user_topics', [])
        formality = data.get('formality', 'friendly')
        feedback_language = data.get('feedback_language', 'en')
        user_goals = data.get('user_goals', [])
        description = data.get('description', None)
        
        print(f"🤖 AI response request - Language: {language}, Level: {user_level}")
        
        # Get conversational response
        response = get_conversational_response(
            user_input, 
            chat_history, 
            language, 
            user_level, 
            user_topics, 
            formality, 
            feedback_language, 
            user_goals, 
            description
        )
        
        return jsonify({
            "response": response,
            "success": True
        })
        
    except Exception as e:
        print(f"❌ AI response error: {e}")
        return jsonify({
            "error": str(e),
            "response": ""
        })

@app.route('/analyze', methods=['POST'])
def analyze():
    """Analyze speech with reference text"""
    try:
        data = request.get_json()
        audio_file = data.get('audio_file')
        reference_text = data.get('reference_text', '')
        language = data.get('language', 'en')
        
        print(f"🔍 Analyze request - Language: {language}")
        
        # Analyze speech
        result = analyze_speech_with_gemini(audio_file, reference_text, language)
        
        return jsonify({
            "transcription": result["transcription"],
            "reference": result["reference"],
            "analysis": result["analysis"],
            "success": True
        })
        
    except Exception as e:
        print(f"❌ Analyze error: {e}")
        return jsonify({
            "error": str(e),
            "transcription": "",
            "reference": "",
            "analysis": ""
        })

@app.route('/conversation_summary', methods=['POST'])
def conversation_summary():
    """Generate conversation summary"""
    try:
        data = request.get_json()
        chat_history = data.get('chat_history', [])
        subgoal_instructions = data.get('subgoal_instructions', '')
        user_topics = data.get('user_topics', [])
        target_language = data.get('target_language', 'en')
        feedback_language = data.get('feedback_language', 'en')
        is_continued_conversation = data.get('is_continued_conversation', False)
        
        print(f"📊 Conversation summary request - Language: {target_language}")
        
        from gemini_client import generate_conversation_summary
        
        # Generate summary
        summary = generate_conversation_summary(
            chat_history,
            subgoal_instructions,
            user_topics,
            target_language,
            feedback_language,
            is_continued_conversation
        )
        
        # Ensure progress_percentages is always included
        progress_percentages = summary.get("progress_percentages", [])
        print(f"DEBUG: Final progress_percentages being sent: {progress_percentages}")
        
        # CRITICAL: Always include progress_percentages in response
        response_data = {
            "title": summary["title"],
            "synopsis": summary["synopsis"],
            "progress_percentages": progress_percentages,
            "success": True
        }
        
        print(f"DEBUG: Complete response data: {response_data}")
        return jsonify(response_data)
        
    except Exception as e:
        print(f"❌ Conversation summary error: {e}")
        return jsonify({
            "error": str(e),
            "title": "",
            "synopsis": "",
            "progress_percentages": []
        })

@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint"""
    try:
        # Check if Gemini is ready
        from gemini_client import is_gemini_ready
        gemini_ready = is_gemini_ready()
        
        return jsonify({
            "status": "healthy",
            "timestamp": datetime.datetime.now().isoformat(),
            "gemini_ready": gemini_ready,
            "python_api": True
        })
    except Exception as e:
        return jsonify({
            "status": "unhealthy",
            "error": str(e),
            "timestamp": datetime.datetime.now().isoformat()
        }), 500

@app.route('/feedback', methods=['POST'])
def feedback():
    """Get detailed feedback"""
    try:
        data = request.get_json()
        phoneme_analysis = data.get('phoneme_analysis', '')
        reference_text = data.get('reference_text', '')
        recognized_text = data.get('recognized_text', '')
        chat_history = data.get('chat_history', [])
        language = data.get('language', 'en')
        user_level = data.get('user_level', 'beginner')
        user_topics = data.get('user_topics', [])
        feedback_language = data.get('feedback_language', 'en')
        description = data.get('description', None)
        romanization_display = data.get('romanization_display', None)
        
        print(f"💬 Feedback request - Language: {language}, Level: {user_level}")
        
        # Get detailed feedback
        feedback = get_detailed_feedback(
            phoneme_analysis,
            reference_text,
            recognized_text,
            chat_history,
            language,
            user_level,
            user_topics,
            feedback_language,
            description,
            romanization_display
        )
        
        return jsonify({
            "feedback": feedback,
            "success": True
        })
        
    except Exception as e:
        print(f"❌ Feedback error: {e}")
        return jsonify({
            "error": str(e),
            "feedback": ""
        })

@app.route('/short_feedback', methods=['POST'])
def short_feedback():
    """Get short feedback"""
    try:
        data = request.get_json()
        user_input = data.get('user_input', '')
        context = data.get('context', '')
        language = data.get('language', 'en')
        user_level = data.get('user_level', 'beginner')
        user_topics = data.get('user_topics', [])
        feedback_language = data.get('feedback_language', 'en')
        user_goals = data.get('user_goals', [])
        description = data.get('description', None)
        
        print(f"💬 Short feedback request - Language: {language}")
        
        # Get short feedback
        feedback = get_short_feedback(
            user_input,
            context,
            language,
            user_level,
            user_topics,
            feedback_language,
            user_goals,
            description
        )
        
        return jsonify({
            "feedback": feedback,
            "success": True
        })
        
    except Exception as e:
        print(f"❌ Short feedback error: {e}")
        return jsonify({
            "error": str(e),
            "feedback": ""
        })

@app.route('/initial_message', methods=['POST'])
def initial_message():
    """Get initial message for conversation"""
    try:
        data = request.get_json()
        language = data.get('language', 'en')
        user_level = data.get('user_level', 'beginner')
        user_topics = data.get('user_topics', [])
        formality = data.get('formality', 'friendly')
        feedback_language = data.get('feedback_language', 'en')
        user_goals = data.get('user_goals', [])
        description = data.get('description', None)
        
        print(f"👋 Initial message request - Language: {language}, Level: {user_level}")
        
        # Get initial message
        response = get_conversational_response(
            "",  # Empty input for initial message
            [],  # Empty chat history
            language,
            user_level,
            user_topics,
            formality,
            feedback_language,
            user_goals,
            description
        )
        
        return jsonify({
            "message": response,
            "success": True
        })
        
    except Exception as e:
        print(f"❌ Initial message error: {e}")
        return jsonify({
            "error": str(e),
            "message": ""
        })

@app.route('/suggestions', methods=['POST'])
def suggestions():
    """Get text suggestions"""
    try:
        data = request.get_json()
        chat_history = data.get('chat_history', [])
        language = data.get('language', 'en')
        user_level = data.get('user_level', 'beginner')
        user_topics = data.get('user_topics', [])
        formality = data.get('formality', 'friendly')
        feedback_language = data.get('feedback_language', 'en')
        user_goals = data.get('user_goals', [])
        description = data.get('description', None)
        
        print(f"💡 Suggestions request - Language: {language}, Level: {user_level}")
        
        # Get suggestions
        suggestions = get_text_suggestions(
            chat_history,
            language,
            user_level,
            user_topics,
            formality,
            feedback_language,
            user_goals,
            description
        )
        
        return jsonify({
            "suggestions": suggestions,
            "success": True
        })
        
    except Exception as e:
        print(f"❌ Suggestions error: {e}")
        return jsonify({
            "error": str(e),
            "suggestions": []
        })

@app.route('/translate', methods=['POST'])
def translate():
    """Translate text"""
    try:
        data = request.get_json()
        text = data.get('text', '')
        source_language = data.get('source_language', 'auto')
        target_language = data.get('target_language', 'en')
        breakdown = data.get('breakdown', False)
        user_topics = data.get('user_topics', [])
        
        print(f"🌐 Translate request - From: {source_language}, To: {target_language}")
        
        # Get translation
        translation = get_translation(
            text,
            source_language,
            target_language,
            breakdown,
            user_topics
        )
        
        return jsonify({
            "translation": translation,
            "success": True
        })
        
    except Exception as e:
        print(f"❌ Translate error: {e}")
        return jsonify({
            "error": str(e),
            "translation": {}
        })

@app.route('/detailed_breakdown', methods=['POST'])
def detailed_breakdown():
    """Get detailed breakdown of AI response"""
    try:
        data = request.get_json()
        llm_response = data.get('llm_response', '')
        user_input = data.get('user_input', '')
        context = data.get('context', '')
        language = data.get('language', 'en')
        user_level = data.get('user_level', 'beginner')
        user_topics = data.get('user_topics', [])
        formality = data.get('formality', 'friendly')
        feedback_language = data.get('feedback_language', 'en')
        user_goals = data.get('user_goals', [])
        description = data.get('description', None)
        
        print(f"🔍 Detailed breakdown request - Language: {language}")
        
        # Get detailed breakdown
        breakdown = get_detailed_breakdown(
            llm_response,
            user_input,
            context,
            language,
            user_level,
            user_topics,
            formality,
            feedback_language,
            user_goals,
            description
        )
        
        return jsonify({
            "breakdown": breakdown,
            "success": True
        })
        
    except Exception as e:
        print(f"❌ Detailed breakdown error: {e}")
        return jsonify({
            "error": str(e),
            "breakdown": ""
        })

@app.route('/explain_suggestion', methods=['POST'])
def explain_suggestion():
    """Explain a specific suggestion"""
    try:
        data = request.get_json()
        suggestion_text = data.get('suggestion_text', '')
        context = data.get('context', '')
        language = data.get('language', 'en')
        user_level = data.get('user_level', 'beginner')
        user_topics = data.get('user_topics', [])
        feedback_language = data.get('feedback_language', 'en')
        user_goals = data.get('user_goals', [])
        description = data.get('description', None)
        
        print(f"💡 Explain suggestion request - Language: {language}")
        
        # Get or create tutor instance
        from gemini_client import create_tutor
        tutor = create_tutor(language, user_level, user_topics)
        
        # Explain suggestion
        explanation = tutor.explain_suggestion(
            suggestion_text,
            context,
            description
        )
        
        return jsonify({
            "translation": explanation.get("translation", ""),
            "explanation": explanation.get("explanation", ""),
            "success": True
        })
        
    except Exception as e:
        print(f"❌ Explain suggestion error: {e}")
        return jsonify({
            "error": str(e),
            "translation": "",
            "explanation": ""
        })

@app.route('/quick_translation', methods=['POST'])
def quick_translation():
    """Get quick translation of AI message"""
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
        
        print(f"🌐 Quick translation request - Language: {language}")
        
        # Get quick translation (hybrid with source metadata)
        result = get_quick_translation_hybrid_with_meta(
            ai_message,
            language,
            user_level,
            user_topics,
            formality,
            feedback_language,
            user_goals,
            description
        )
        
        return jsonify({
            "translation": result.get("translation", ""),
            "source": result.get("source", "UNKNOWN"),
            "success": True
        })
        
    except Exception as e:
        print(f"❌ Quick translation error: {e}")
        return jsonify({
            "error": str(e),
            "translation": ""
        })

@app.route('/generate_tts', methods=['POST'])
def generate_tts():
    """Generate TTS audio with debug information"""
    try:
        data = request.get_json()
        text = data.get('text', '')
        language_code = data.get('language_code', 'en')
        output_path = data.get('output_path', 'tts_output/response.wav')
        
        print(f"🎤 TTS request - Language: {language_code}, Text length: {len(text)}")
        
        # Generate TTS with debug info
        result = synthesize_speech(text, language_code, output_path)
        
        # Handle new dict return format from TTS synthesizer
        if isinstance(result, dict):
            # New format with debug info
            if result.get('success'):
                return jsonify({
                    "success": True,
                    "output_path": result.get('output_path'),
                    "message": "TTS generated successfully",
                    # Include debug information
                    "service_used": result.get('service_used', 'unknown'),
                    "fallback_reason": result.get('fallback_reason', 'none'),
                    "admin_settings": result.get('admin_settings', {}),
                    "cost_estimate": result.get('cost_estimate', 'unknown'),
                    "request_id": result.get('request_id', 'unknown'),
                    "debug": result
                })
            else:
                return jsonify({
                    "success": False,
                    "error": result.get('error', 'TTS generation failed'),
                    "service_used": result.get('service_used', 'unknown'),
                    "fallback_reason": result.get('fallback_reason', 'none'),
                    "admin_settings": result.get('admin_settings', {}),
                    "cost_estimate": result.get('cost_estimate', 'unknown'),
                    "request_id": result.get('request_id', 'unknown'),
                    "debug": result
                })
        else:
            # Legacy string return format (fallback)
            if result:
                return jsonify({
                    "success": True,
                    "output_path": result,
                    "message": "TTS generated successfully (legacy format)",
                    "service_used": "unknown",
                    "fallback_reason": "legacy_format",
                    "admin_settings": {},
                    "cost_estimate": "unknown",
                    "debug": {"legacy_format": True}
                })
            else:
                return jsonify({
                    "success": False,
                    "error": "TTS generation failed",
                    "service_used": "unknown",
                    "fallback_reason": "legacy_format_failed",
                    "admin_settings": {},
                    "cost_estimate": "unknown",
                    "debug": {"legacy_format": True, "failed": True}
                })
        
    except Exception as e:
        print(f"❌ TTS error: {e}")
        return jsonify({
            "success": False,
            "error": str(e),
            "service_used": "none",
            "fallback_reason": "exception",
            "admin_settings": {},
            "cost_estimate": "unknown",
            "debug": {"exception": str(e)}
        })

@app.route('/admin')
def admin_index():
    """Main admin dashboard page"""
    from admin_dashboard import AdminDashboard
    dashboard = AdminDashboard()
    
    settings = dashboard.get_tts_settings()
    usage_stats = dashboard.get_usage_stats()
    google_api_settings = dashboard.get_google_api_settings()
    
    return render_template('admin_dashboard.html', 
                         settings=settings,
                         usage_stats=usage_stats,
                         google_api_settings=google_api_settings)

@app.route('/admin/login', methods=['GET', 'POST'])
def admin_login():
    """Admin login page"""
    from admin_dashboard import AdminDashboard
    dashboard = AdminDashboard()
    
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
    from admin_dashboard import AdminDashboard
    dashboard = AdminDashboard()
    
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
    from admin_dashboard import AdminDashboard
    dashboard = AdminDashboard()
    
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
    from admin_dashboard import AdminDashboard
    dashboard = AdminDashboard()
    
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
    from admin_dashboard import AdminDashboard
    dashboard = AdminDashboard()
    
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
    from admin_dashboard import AdminDashboard
    dashboard = AdminDashboard()
    
    if 'admin_logged_in' not in session:
        return jsonify({"error": "Not authenticated"}), 401
    
    dashboard.reset_daily_usage()
    return jsonify({"success": True, "message": "Usage reset"})

@app.route('/admin/api/set_tts_system', methods=['POST'])
def admin_api_set_tts_system():
    """Set the active TTS system"""
    from admin_dashboard import AdminDashboard
    dashboard = AdminDashboard()
    
    data = request.get_json()
    system = data.get('system')
    
    if system not in ['system', 'cloud', 'gemini']:
        return jsonify({"success": False, "message": "Invalid TTS system"})
    
    dashboard.update_tts_settings({"active_tts": system})
    return jsonify({"success": True, "message": f"TTS system changed to {system.upper()}"})

@app.route('/admin/api/change_password', methods=['POST'])
def admin_api_change_password():
    """Change admin password"""
    from admin_dashboard import AdminDashboard
    dashboard = AdminDashboard()
    
    if 'admin_logged_in' not in session:
        return jsonify({"error": "Not authenticated"}), 401
    
    data = request.get_json()
    old_password = data.get('old_password')
    new_password = data.get('new_password')
    
    if dashboard.change_password(old_password, new_password):
        return jsonify({"success": True, "message": "Password changed"})
    else:
        return jsonify({"success": False, "message": "Invalid current password"})

@app.route('/admin/api/toggle_google_api', methods=['POST'])
def admin_api_toggle_google_api():
    """Toggle Google API services"""
    from admin_dashboard import AdminDashboard
    dashboard = AdminDashboard()
    
    # Since this is called from the admin dashboard, we'll allow it without session check
    # The admin dashboard itself requires authentication to access
    
    data = request.get_json()
    enabled = data.get('enabled', False)
    
    if enabled:
        if dashboard.enable_google_api_services("admin123"):  # Using default password for now
            return jsonify({"success": True, "message": "Google API services enabled"})
        else:
            return jsonify({"success": False, "message": "Failed to enable Google API services"})
    else:
        if dashboard.disable_google_api_services("admin123"):  # Using default password for now
            return jsonify({"success": True, "message": "Google API services disabled"})
        else:
            return jsonify({"success": False, "message": "Failed to disable Google API services"})

if __name__ == '__main__':
    print("Starting Python Speech Analysis API...")
    print("🔐 Admin Dashboard: http://localhost:5000/admin")
    print("🔑 Default password: admin123")
    load_models()
    
    # Use PORT environment variable for Render
    PORT = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=PORT, debug=False) 