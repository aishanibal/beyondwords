#!/usr/bin/env python3
"""
Test script to verify the parsing logic works with the actual backend response format
"""

def test_parse_breakdown_response():
    """Test the parsing logic with a sample response"""
    
    # Sample response from the backend (what explain_llm_response actually returns)
    sample_response = """Hello
This is a very common and friendly way to greet someone. It's like saying "hi" when you meet someone.

• Hello (huh-LOH) – A common English word used to greet people.
Literal translation – Hello
Sentence structure pattern – This word is a greeting. It works as a complete idea by itself.

how are you?
This is a friendly question. You ask this after saying "hello" to ask about how someone is feeling or doing. It shows you care about them.

• how (HOW) – This word asks about the way something is, or the condition of something.
• are (AHR) – This is a form of the verb "to be." It connects "how" to "you" to ask about your state.
• you (YOO) – This word means the person you are talking to.
Literal translation – How are you?
Sentence structure pattern – This is a common question pattern in English. It starts with "How" to ask about a state, then uses a form of "to be" (like "are"), and then the person (like "you")."""

    print("Sample response from backend:")
    print("=" * 50)
    print(sample_response)
    print("=" * 50)
    
    # Simulate the frontend parsing logic
    sections = sample_response.split('\n\n')
    sections = [section.strip() for section in sections if section.strip()]
    
    print(f"\nSplit into {len(sections)} sections:")
    for i, section in enumerate(sections):
        print(f"\nSection {i}:")
        print(f"'{section}'")
    
    # Parse sentences
    sentences = []
    current_sentence = None
    current_overview = ''
    current_details = []
    
    for section in sections:
        lines = section.split('\n')
        first_line = lines[0].strip() if lines else ''
        
        # Check if this looks like a sentence
        if (first_line and first_line and not first_line.startswith('•') and 
            not first_line.includes('Literal translation') and 
            not first_line.includes('Sentence structure pattern')):
            
            # Save previous sentence
            if current_sentence:
                sentences.append({
                    'sentence': current_sentence,
                    'overview': current_overview,
                    'details': '\n\n'.join(current_details).strip()
                })
            
            # Start new sentence
            current_sentence = first_line
            current_overview = '\n'.join(lines[1:]).strip()
            current_details = []
        else:
            # This is a details section
            if current_sentence and (section.startswith('•') or 
                'Literal translation' in section or 
                'Sentence structure pattern' in section):
                current_details.append(section)
    
    # Add the last sentence
    if current_sentence:
        sentences.append({
            'sentence': current_sentence,
            'overview': current_overview,
            'details': '\n\n'.join(current_details).strip()
        })
    
    print(f"\nParsed {len(sentences)} sentences:")
    for i, sentence in enumerate(sentences):
        print(f"\nSentence {i}:")
        print(f"  Sentence: '{sentence['sentence']}'")
        print(f"  Overview: '{sentence['overview']}'")
        print(f"  Details: '{sentence['details']}'")

if __name__ == "__main__":
    test_parse_breakdown_response() 