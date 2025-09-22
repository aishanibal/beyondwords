/* eslint-disable @typescript-eslint/no-explicit-any */
import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

const BACKEND_URL = (process.env.BACKEND_URL || 'https://beyondwords-express.onrender.com').replace(/\/$/, '');

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

    const authHeader = req.headers.authorization || '';
    const primaryUrl = `${BACKEND_URL}/api/tts`;
    const fallbackUrl = `${BACKEND_URL}/api/tts-test`;

    console.log('🔍 [TTS_API] Calling backend (primary):', {
      url: primaryUrl,
      hasAuth: !!authHeader,
    });

    let response;
    try {
      response = await axios.post(primaryUrl, req.body, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authHeader,
        },
        timeout: 30000
      });
    } catch (primaryErr: any) {
      const status = primaryErr?.response?.status;
      console.warn('🔍 [TTS_API] Primary call failed:', status, primaryErr?.response?.data);
      // Fallback if no auth provided or protected route fails (401/403/404)
      if (!authHeader || status === 401 || status === 403 || status === 404) {
        console.log('🔍 [TTS_API] Falling back to:', fallbackUrl);
        response = await axios.post(fallbackUrl, req.body, {
          headers: { 'Content-Type': 'application/json' },
          timeout: 30000
        });
      } else {
        throw primaryErr;
      }
    }
    
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
