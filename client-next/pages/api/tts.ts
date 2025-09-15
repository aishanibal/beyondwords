/* eslint-disable @typescript-eslint/no-explicit-any */
import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

const BACKEND_URL = process.env.BACKEND_URL || 'https://beyondwords-express.onrender.com';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {
    console.log('🔍 [TTS_API] Request received:', {
      method: req.method,
      body: req.body,
      headers: req.headers
    });

    console.log('🔍 [TTS_API] Calling backend:', {
      url: `${BACKEND_URL}/api/tts-test`,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': req.headers.authorization || '',
      }
    });

    const response = await axios.post(`${BACKEND_URL}/api/tts-test`, req.body, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': req.headers.authorization || '',
      },
      timeout: 30000
    });
    
    console.log('🔍 [TTS_API] Backend response:', {
      status: response.status,
      data: response.data
    });
    
    res.status(response.status).json(response.data);
  } catch (err: any) {
    console.error('🔍 [TTS_API] Error:', err);
    
    if (err.response) {
      console.error('🔍 [TTS_API] Backend error response:', {
        status: err.response.status,
        data: err.response.data
      });
      res.status(err.response.status).json(err.response.data);
    } else {
      console.error('🔍 [TTS_API] Network/other error:', err.message);
      res.status(500).json({ 
        error: 'TTS generation failed', 
        details: err.message 
      });
    }
  }
}
