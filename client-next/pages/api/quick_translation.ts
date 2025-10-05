/* eslint-disable @typescript-eslint/no-explicit-any */
import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

const BACKEND_URL = process.env.AI_BACKEND_URL || 'https://beyondwords.onrender.com';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {
    console.log('🔍 [QUICK_TRANSLATION_API] Request received:', {
      method: req.method,
      body: req.body,
      headers: req.headers
    });

    console.log('🔍 [QUICK_TRANSLATION_API] Calling backend:', {
      url: BACKEND_URL,
      headers: {
        'Content-Type': 'application/json',
      }
    });

    const response = await axios.post(`${BACKEND_URL}/api/quick_translation`, req.body, {
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    console.log('🔍 [QUICK_TRANSLATION_API] Backend response:', {
      status: response.status,
      data: response.data
    });
    
    res.status(response.status).json(response.data);
  } catch (err: any) {
    console.error('🔍 [QUICK_TRANSLATION_API] Error:', err);
    
    if (err.response) {
      console.error('🔍 [QUICK_TRANSLATION_API] Backend error response:', {
        status: err.response.status,
        data: err.response.data
      });
      res.status(err.response.status).json(err.response.data);
    } else {
      console.error('🔍 [QUICK_TRANSLATION_API] Network/other error:', err.message);
      res.status(500).json({ 
        error: 'Failed to get quick translation', 
        details: err.message 
      });
    }
  }
}
