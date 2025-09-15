/* eslint-disable @typescript-eslint/no-explicit-any */
import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

const BACKEND_URL = process.env.AI_BACKEND_URL || 'https://beyondwords.onrender.com/ai_response';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {
    console.log('🔍 [AI_RESPONSE_API] Request received:', {
      method: req.method,
      body: req.body,
      headers: req.headers
    });

    console.log('🔍 [AI_RESPONSE_API] Calling backend:', {
      url: BACKEND_URL,
      headers: {
        'Content-Type': 'application/json',
      }
    });

    const response = await axios.post(BACKEND_URL, req.body, {
      headers: {
        'Content-Type': 'application/json',
      }
    });

    console.log('🔍 [AI_RESPONSE_API] Backend response:', {
      status: response.status,
      data: response.data
    });

    res.status(response.status).json(response.data);
  } catch (err: any) {
    console.error('🔍 [AI_RESPONSE_API] Error:', err);
    
    if (err.response) {
      console.error('🔍 [AI_RESPONSE_API] Backend error response:', {
        status: err.response.status,
        data: err.response.data
      });
      res.status(err.response.status).json(err.response.data);
    } else {
      console.error('🔍 [AI_RESPONSE_API] Network/other error:', err.message);
      res.status(500).json({ error: 'Proxy error', details: err.message });
    }
  }
} 