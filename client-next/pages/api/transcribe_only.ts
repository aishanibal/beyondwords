/* eslint-disable @typescript-eslint/no-explicit-any */
import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';
import fs from 'fs';
import path from 'path';
import os from 'os';
import busboy from 'busboy';

export const config = {
  api: {
    bodyParser: false,
  },
};

const BACKEND_URL = process.env.AI_BACKEND_URL || 'https://beyondwords.onrender.com/transcribe_only';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {
    console.log('🎤 Transcribe API called, processing audio...');
    
    // Parse multipart form data
    const bb = busboy({ headers: req.headers });
    const fields: { [key: string]: string } = {};
    let audioBuffer: Buffer | null = null;
    let audioFilename = 'recording.webm';

    const parsePromise = new Promise<void>((resolve, reject) => {
      bb.on('field', (name, val) => {
        fields[name] = val;
      });

      bb.on('file', (name, file, info) => {
        if (name === 'audio') {
          audioFilename = info.filename || 'recording.webm';
          const chunks: Buffer[] = [];
          file.on('data', (data) => {
            chunks.push(data);
          });
          file.on('end', () => {
            audioBuffer = Buffer.concat(chunks);
          });
        } else {
          file.resume(); // Drain other files
        }
      });

      bb.on('finish', resolve);
      bb.on('error', reject);
    });

    req.pipe(bb);
    await parsePromise;

    if (!audioBuffer) {
      return res.status(400).json({ error: 'No audio file provided' });
    }

    console.log(`📁 Received audio file: ${audioFilename}, size: ${audioBuffer.length} bytes`);

    // Save audio to temporary file
    const tempDir = os.tmpdir();
    const tempFilename = `audio_${Date.now()}_${Math.random().toString(36).substr(2, 9)}.webm`;
    const tempFilePath = path.join(tempDir, tempFilename);
    
    fs.writeFileSync(tempFilePath, audioBuffer);
    console.log(`💾 Saved audio to: ${tempFilePath}`);

    try {
      console.log('🔍 [TRANSCRIBE_API] Calling Python backend:', {
        url: BACKEND_URL,
        audio_data: `base64_${audioBuffer.length}_bytes`,
        language: fields.language || 'en',
        audio_size: audioBuffer.length
      });

      // Send audio data directly as base64 instead of file path
      const response = await axios.post(BACKEND_URL, {
        audio_data: audioBuffer.toString('base64'),
        audio_filename: audioFilename,
        language: fields.language || 'en'
      }, {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 30000 // 30 second timeout
      });

      console.log('🔍 [TRANSCRIBE_API] Python backend response:', {
        status: response.status,
        data: response.data
      });
      
      res.status(response.status).json(response.data);
    } finally {
      // Clean up temp file
      try {
        fs.unlinkSync(tempFilePath);
        console.log(`🗑️ Cleaned up temp file: ${tempFilePath}`);
      } catch (cleanupErr) {
        console.warn('Warning: Could not clean up temp file:', cleanupErr);
      }
    }

  } catch (err: any) {
    console.error('❌ Transcribe API error:', err.message);
    console.error('Stack:', err.stack);
    
    if (err.response) {
      console.error('Backend response:', err.response.status, err.response.data);
      res.status(err.response.status).json(err.response.data);
    } else {
      res.status(500).json({ 
        error: 'Proxy error', 
        details: err.message,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
      });
    }
  }
} 