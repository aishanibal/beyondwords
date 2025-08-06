/* eslint-disable @typescript-eslint/no-explicit-any */
import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

const BACKEND_URL = `${process.env.NEXT_PUBLIC_PYTHON_API_URL || 'http://localhost:5000'}/generate_tts`;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  console.log('--- [api/tts] REQUEST BODY:', req.body);

  try {
    const { text, language } = req.body;
    
    if (!text || !text.trim()) {
      return res.status(400).json({ error: 'Text is required' });
    }
    
    const lang = language || 'en';
    
    // Forward to Python API
    const response = await axios.post(BACKEND_URL, {
      text: text.trim(),
      language_code: lang
    }, {
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 120000, // 2 minutes
    });
    
    console.log('--- [api/tts] PYTHON RESPONSE:', response.data);
    
    if (response.data.success && response.data.output_path) {
      // Return the TTS URL
      res.json({ ttsUrl: response.data.output_path });
    } else {
      res.status(500).json({ error: 'Failed to generate TTS' });
    }
  } catch (error: any) {
    console.error('--- [api/tts] ERROR:', error.message);
    if (axios.isAxiosError(error)) {
      console.error('--- [api/tts] AXIOS ERROR DETAILS:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message
      });
    }
    res.status(500).json({ error: 'TTS generation failed', details: error.message });
  }
} 