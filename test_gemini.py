#!/usr/bin/env python3
"""
Comprehensive test script for Gemini integration
Tests all major functionality of the speech analysis app
"""

import os
import sys
import time
from datetime import datetime

def print_header(title):
    """Print a formatted header"""
    print(f"\n{'='*60}")
    print(f"🧪 {title}")
    print(f"{'='*60}")

def print_success(message):
    """Print a success message"""
    print(f"✅ {message}")

def print_error(message):
    """Print an error message"""
    print(f"❌ {message}")

def print_info(message):
    """Print an info message"""
    print(f"ℹ️ {message}")

def test_environment():
    """Test environment setup"""
    print_header("Environment Setup")
    
    # Check Python version
    python_version = sys.version_info
    if python_version.major >= 3 and python_version.minor >= 8:
        print_success(f"Python version: {python_version.major}.{python_version.minor}.{python_version.micro}")
    else:
        print_error(f"Python version {python_version.major}.{python_version.minor} is too old. Need 3.8+")
        return False
    
    # Check API key
    api_key = os.getenv("GOOGLE_API_KEY")
    if api_key:
        # Mask the API key for security
        masked_key = api_key[:8] + "*" * (len(api_key) - 12) + api_key[-4:] if len(api_key) > 12 else "***"
        print_success(f"Google API key is set: {masked_key}")
    else:
        print_error("GOOGLE_API_KEY environment variable is not set!")
        print_info("Please set your Google API key:")
        print_info("export GOOGLE_API_KEY='your-api-key-here'")
        return False
    
    return True

def test_imports():
    """Test if all required modules can be imported"""
    print_header("Module Imports")
    
    try:
        import google.generativeai as genai
        print_success("Google Generative AI module imported")
    except ImportError as e:
        print_error(f"Failed to import google.generativeai: {e}")
        print_info("Install with: pip install google-generativeai")
        return False
    
    try:
        from gemini_client import (
            get_conversational_response, 
            get_detailed_feedback, 
            get_text_suggestions,
            get_translation,
            is_gemini_ready,
            FilipinoHeritageTutor
        )
        print_success("All gemini_client functions imported")
    except ImportError as e:
        print_error(f"Failed to import gemini_client functions: {e}")
        return False
    
    return True

def test_api_connection():
    """Test basic API connection"""
    print_header("API Connection Test")
    
    try:
        from gemini_client import is_gemini_ready
        
        print_info("Testing connection to Google AI API...")
        is_ready = is_gemini_ready()
        
        if is_ready:
            print_success("Successfully connected to Google AI API")
            return True
        else:
            print_error("Failed to connect to Google AI API")
            return False
    except Exception as e:
        print_error(f"Error testing API connection: {e}")
        return False

def test_conversational_responses():
    """Test conversational response generation for different languages"""
    print_header("Conversational Response Tests")
    
    test_cases = [
        {
            "language": "en",
            "input": "Hello, how are you today?",
            "description": "English conversation"
        },
        {
            "language": "es", 
            "input": "Hola, ¿cómo estás?",
            "description": "Spanish conversation"
        },
        {
            "language": "hi",
            "input": "नमस्ते, कैसे हो आप?",
            "description": "Hindi conversation"
        },
        {
            "language": "ja",
            "input": "こんにちは、お元気ですか？",
            "description": "Japanese conversation"
        },
        {
            "language": "tl",
            "input": "Kumusta ka?",
            "description": "Tagalog/Filipino conversation"
        }
    ]
    
    try:
        from gemini_client import get_conversational_response
        
        for test_case in test_cases:
            print_info(f"Testing {test_case['description']}...")
            
            response = get_conversational_response(
                test_case["input"],
                [],  # Empty chat history
                test_case["language"]
            )
            
            if response and len(response) > 10:
                print_success(f"{test_case['description']}: {response[:100]}...")
            else:
                print_error(f"{test_case['description']}: Response too short or empty")
                return False
        
        return True
    except Exception as e:
        print_error(f"Error testing conversational responses: {e}")
        return False

def test_detailed_feedback():
    """Test detailed feedback generation"""
    print_header("Detailed Feedback Tests")
    
    test_cases = [
        {
            "language": "en",
            "transcription": "Hello world",
            "expected": "Hello world",
            "description": "English feedback"
        },
        {
            "language": "es",
            "transcription": "Hola mundo",
            "expected": "Hola mundo", 
            "description": "Spanish feedback"
        }
    ]
    
    try:
        from gemini_client import get_detailed_feedback
        
        for test_case in test_cases:
            print_info(f"Testing {test_case['description']}...")
            
            feedback = get_detailed_feedback(
                "Phoneme analysis: Good pronunciation overall",
                test_case["transcription"],
                test_case["expected"],
                [],
                test_case["language"]
            )
            
            if feedback and len(feedback) > 20:
                print_success(f"{test_case['description']}: {feedback[:150]}...")
            else:
                print_error(f"{test_case['description']}: Feedback too short")
                return False
        
        return True
    except Exception as e:
        print_error(f"Error testing detailed feedback: {e}")
        return False

def test_text_suggestions():
    """Test text suggestions generation"""
    print_header("Text Suggestions Tests")
    
    try:
        from gemini_client import get_text_suggestions
        
        suggestions = get_text_suggestions(
            "Hello, I want to practice",
            [],
            "en"
        )
        
        if suggestions and len(suggestions) > 0:
            print_success(f"Generated {len(suggestions)} suggestions")
            for i, suggestion in enumerate(suggestions[:3], 1):
                print_info(f"Suggestion {i}: {suggestion}")
        else:
            print_error("No suggestions generated")
            return False
        
        return True
    except Exception as e:
        print_error(f"Error testing text suggestions: {e}")
        return False

def test_translation():
    """Test translation functionality"""
    print_header("Translation Tests")
    
    test_cases = [
        {
            "text": "Hello, how are you?",
            "source": "en",
            "target": "es",
            "description": "English to Spanish"
        },
        {
            "text": "Hola, ¿cómo estás?",
            "source": "es", 
            "target": "en",
            "description": "Spanish to English"
        }
    ]
    
    try:
        from gemini_client import get_translation
        
        for test_case in test_cases:
            print_info(f"Testing {test_case['description']}...")
            
            translation = get_translation(
                test_case["text"],
                test_case["source"],
                test_case["target"]
            )
            
            if translation and len(translation) > 5:
                print_success(f"{test_case['description']}: {translation}")
            else:
                print_error(f"{test_case['description']}: Translation failed")
                return False
        
        return True
    except Exception as e:
        print_error(f"Error testing translation: {e}")
        return False

def test_filipino_tutor():
    """Test Filipino heritage tutor functionality"""
    print_header("Filipino Heritage Tutor Tests")
    
    try:
        from gemini_client import FilipinoHeritageTutor
        
        tutor = FilipinoHeritageTutor()
        
        # Test basic response
        response = tutor.provide_conversational_response(
            "Kumusta ka?",
            "Starting a new conversation"
        )
        
        if response and len(response) > 20:
            print_success(f"Filipino tutor response: {response[:150]}...")
        else:
            print_error("Filipino tutor response too short")
            return False
        
        # Test grammar correction
        response = tutor.provide_grammar_correction(
            "Ako ay maganda",
            "I am beautiful"
        )
        
        if response and len(response) > 20:
            print_success(f"Grammar correction: {response[:150]}...")
        else:
            print_error("Grammar correction failed")
            return False
        
        return True
    except Exception as e:
        print_error(f"Error testing Filipino tutor: {e}")
        return False

def test_performance():
    """Test response times"""
    print_header("Performance Tests")
    
    try:
        from gemini_client import get_conversational_response
        
        print_info("Testing response time for English conversation...")
        start_time = time.time()
        
        response = get_conversational_response(
            "Hello, how are you?",
            [],
            "en"
        )
        
        end_time = time.time()
        response_time = end_time - start_time
        
        if response_time < 10:  # Should respond within 10 seconds
            print_success(f"Response time: {response_time:.2f} seconds")
        else:
            print_error(f"Response too slow: {response_time:.2f} seconds")
            return False
        
        return True
    except Exception as e:
        print_error(f"Error testing performance: {e}")
        return False

def main():
    """Run all tests"""
    print_header("Gemini Integration Test Suite")
    print(f"Started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    tests = [
        ("Environment Setup", test_environment),
        ("Module Imports", test_imports),
        ("API Connection", test_api_connection),
        ("Conversational Responses", test_conversational_responses),
        ("Detailed Feedback", test_detailed_feedback),
        ("Text Suggestions", test_text_suggestions),
        ("Translation", test_translation),
        ("Filipino Tutor", test_filipino_tutor),
        ("Performance", test_performance)
    ]
    
    passed = 0
    total = len(tests)
    
    for test_name, test_func in tests:
        try:
            if test_func():
                passed += 1
            else:
                print_error(f"{test_name} failed")
        except Exception as e:
            print_error(f"{test_name} failed with exception: {e}")
    
    print_header("Test Results")
    print(f"Passed: {passed}/{total} tests")
    
    if passed == total:
        print_success("All tests passed! Gemini integration is working correctly.")
        print_info("\nNext steps:")
        print_info("1. Start the Python API: python python_api.py")
        print_info("2. Start the Node.js server: cd server && npm start") 
        print_info("3. Start the React client: cd client && npm start")
        print_info("4. Or use the startup script: ./start_app.sh")
    else:
        print_error(f"{total - passed} test(s) failed. Please check the errors above.")
        sys.exit(1)

if __name__ == "__main__":
    main() 