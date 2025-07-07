import json
import requests
import subprocess
import os
from typing import Dict, Any
import time

class OllamaSpeechAnalyzer:
    def __init__(self, ollama_url="http://localhost:11434"):
        self.ollama_url = ollama_url
        self.model_name = "llama3.2"  # or any other model you have
        
    def load_speech_data(self) -> Dict[str, Any]:
        """Load all speech analysis data"""
        data = {}
        
        # Load temporal phrase analysis
        try:
            with open("temporal_phrase_analysis.json", "r") as f:
                data["temporal_features"] = json.load(f)
        except FileNotFoundError:
            print("Warning: temporal_phrase_analysis.json not found")
            data["temporal_features"] = {}
            
        # Load transcript
        try:
            with open("whisper_words.json", "r") as f:
                data["transcript"] = json.load(f)
        except FileNotFoundError:
            print("Warning: whisper_words.json not found")
            data["transcript"] = {}
            
        # Load pause segmentation (if available)
        try:
            with open("pause_segments.json", "r") as f:
                data["pauses"] = json.load(f)
        except FileNotFoundError:
            print("Warning: pause_segments.json not found")
            data["pauses"] = {}
        
        # Load mispronunciations
        try:
            with open("mispronunciations.json", "r") as f:
                data["mispronunciations"] = json.load(f)
        except FileNotFoundError:
            print("Warning: mispronunciations.json not found")
            data["mispronunciations"] = []
        
        return data
    
    def create_analysis_prompt(self, speech_data: Dict[str, Any]) -> str:
        # Use the full output of wav2vec2_transcription.txt as the prompt
        with open("wav2vec2_transcription.txt", "r") as f:
            wav2vec2_output = f.read()

        prompt = f"""
You are an expert dialect and accent coach specializing in American spoken English. 
Your goal is to help improve the speaker's accent, clarity, and naturalness. Make sure to point
out grammer errors and suggest corrections first before pronunciation feedback.
The Whisper reference text represents the intended utterance, while the 
Wav2Vec2 recognized text reflects what the speaker actually said. 
 You are provided with phonemes for both the reference 
(corrected) and hypothesis (spoken) texts. Use these to identify mispronunciations,
 but base your evaluation on the inferred intended sentence, not the raw Whisper text. 
 Provide your feedback in a clear, conversational tone suitable for accent coaching, 
 including: Overall Impression (intonation, rhythm, naturalness) Ranking of words mostly 
 misspoken Specific Feedback on pronunciation errors phonetic pronunciation
 spelling suggestions. 
Here is the analysis output:
{wav2vec2_output}


"""
        return prompt
    
    def wait_for_ollama_ready(self, max_retries=5, delay=1):
        """Wait for Ollama to be ready by pinging /api/tags"""
        for attempt in range(1, max_retries + 1):
            try:
                response = requests.get(f"{self.ollama_url}/api/tags", timeout=3)
                if response.status_code == 200:
                    print(f"Ollama is ready (attempt {attempt})")
                    return True
            except Exception as e:
                print(f"Waiting for Ollama... (attempt {attempt})")
            time.sleep(delay)
        print("Ollama did not become ready in time.")
        return False

    def query_ollama(self, prompt: str, max_retries=3, delay=2) -> str:
        """Send prompt to Ollama and get response, with retry logic"""
        for attempt in range(1, max_retries + 1):
            try:
                response = requests.post(
                    f"{self.ollama_url}/api/generate",
                    json={
                        "model": self.model_name,
                        "prompt": prompt,
                        "stream": False
                    },
                    timeout=60
                )
                response.raise_for_status()
                return response.json()["response"]
            except requests.exceptions.RequestException as e:
                print(f"Error querying Ollama (attempt {attempt}): {e}")
                if attempt < max_retries:
                    print(f"Retrying in {delay} seconds...")
                    time.sleep(delay)
        return "Error: Could not connect to Ollama. Make sure it's running."
    
    def text_to_speech(self, text: str, output_file: str = "ollama_response.wav"):
        """Convert text to speech using system TTS"""
        try:
            # Use macOS say command (you can replace with other TTS engines)
            subprocess.run([
                "say", 
                "-o", output_file,
                "-v", "Alex",  # Voice name
                text
            ], check=True)
            print(f"TTS output saved to: {output_file}")
            return output_file
        except subprocess.CalledProcessError as e:
            print(f"TTS error: {e}")
            return None
    
    def run_analysis(self) -> str:
        """Run the complete analysis pipeline"""
        print("Loading speech data...")
        speech_data = self.load_speech_data()
        
        print("Creating analysis prompt...")
        prompt = self.create_analysis_prompt(speech_data)
        
        print("Checking Ollama health...")
        if not self.wait_for_ollama_ready():
            print("Ollama is not ready. Exiting.")
            return "Error: Ollama is not ready."
        
        print("Querying Ollama for analysis...")
        analysis = self.query_ollama(prompt)
        
        print("Analysis complete!")
        print("\n" + "="*50)
        print("OLLAMA ANALYSIS:")
        print("="*50)
        print(analysis)
        
        # Extract response section for TTS
        if "Response:" in analysis:
            response_text = analysis.split("Response:")[-1].strip()
        else:
            response_text = analysis.strip()

        # Use macOS 'say' to speak the response out loud at a fast rate
        try:
            subprocess.run([
                "say",
                "-v", "Alex",
                "-r", "300",
                response_text
            ], check=True)
        except Exception as e:
            print(f"Error using 'say' command: {e}")

        # (Optional) Still generate TTS file as before
        # tts_file = self.text_to_speech(response_text)
        # if tts_file:
        #     print(f"Speech response generated: {tts_file}")
        
        return analysis

def main():
    # Check if Ollama is running
    try:
        response = requests.get("http://localhost:11434/api/tags", timeout=5)
        if response.status_code != 200:
            print("Error: Ollama is not running or not accessible")
            print("Please start Ollama first: ollama serve")
            return
    except requests.exceptions.RequestException:
        print("Error: Cannot connect to Ollama")
        print("Please start Ollama first: ollama serve")
        return
    
    # Run analysis
    analyzer = OllamaSpeechAnalyzer()
    analysis = analyzer.run_analysis()
    
    # Save analysis to file
    with open("ollama_analysis.txt", "w") as f:
        f.write(analysis)
    print("\nAnalysis saved to: ollama_analysis.txt")

if __name__ == "__main__":
    main() 