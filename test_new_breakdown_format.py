#!/usr/bin/env python3

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from gemini_client import create_tutor

def test_new_breakdown_format():
    """Test the new structured breakdown format"""
    
    # Create a Tagalog tutor
    tutor = create_tutor('tl', 'beginner', [])
    tutor.feedback_language = 'en'
    tutor.user_closeness = 'friendly'
    tutor.user_level = 'beginner'
    
    # Test with a simple Tagalog sentence
    test_response = "Kumusta ka?"
    
    print("Testing new breakdown format...")
    print(f"Input: {test_response}")
    print("-" * 50)
    
    # Get the breakdown
    breakdown = tutor.explain_llm_response(test_response, "", "")
    
    print("Generated breakdown:")
    print(breakdown)
    print("-" * 50)
    
    # Test parsing logic
    sections = breakdown.split('\n\n')
    print(f"Number of sections: {len(sections)}")
    
    if len(sections) >= 2:
        first_section = sections[0].strip()
        remaining_sections = sections[1:].join('\n\n').strip()
        
        # Extract sentence (text between ** **)
        import re
        sentence_match = re.search(r'\*\*(.*?)\*\*', first_section)
        sentence = sentence_match.group(1).strip() if sentence_match else ''
        
        # Extract overview (everything after the sentence)
        overview = first_section.replace(f'**{sentence}**', '').strip()
        
        print(f"Parsed sentence: '{sentence}'")
        print(f"Parsed overview: '{overview}'")
        print(f"Parsed details: '{remaining_sections[:100]}...'")
    else:
        print("Could not parse sections properly")

if __name__ == "__main__":
    test_new_breakdown_format() 