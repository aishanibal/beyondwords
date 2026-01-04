# Use Python 3.11 slim image
FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for better caching
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY python_api.py .
COPY gemini_client.py .
COPY gemini_transcription.py .
COPY gemini_tts_synthesizer.py .
COPY google_cloud_tts_simple.py .
COPY tts_synthesizer_admin_controlled.py .
COPY admin_dashboard.py .
COPY admin_config.json .
COPY templates/ templates/

# Create directories for TTS output
RUN mkdir -p tts_output uploads

# Cloud Run sets PORT env var - default to 8080
ENV PORT=8080

# Run with gunicorn for production
# Bind to 0.0.0.0:$PORT for Cloud Run, use reasonable timeout
CMD exec gunicorn --bind 0.0.0.0:$PORT --workers 1 --threads 8 --timeout 300 python_api:app

