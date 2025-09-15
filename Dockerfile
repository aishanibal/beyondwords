# Use Python 3.11 slim image as base
FROM python:3.11-slim

# Install system dependencies including espeak
RUN apt-get update && \
    apt-get install -y \
    espeak \
    espeak-data \
    festival \
    festival-dev \
    && rm -rf /var/lib/apt/lists/*

# Verify espeak installation
RUN which espeak && espeak --version

# Verify festival installation  
RUN which festival && festival --version

# Test espeak functionality
RUN echo "Testing espeak" | espeak -s 150 -v en

# Set working directory
WORKDIR /app

# Copy requirements first for better caching
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Expose port
EXPOSE 5000

# Run the application
CMD ["python", "python_api.py"]
