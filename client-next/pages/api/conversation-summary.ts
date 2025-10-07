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
    console.log('🔍 [CONVERSATION_SUMMARY_API] Request received:', {
      method: req.method,
      body: req.body,
      headers: req.headers
    });

    console.log('🔍 [CONVERSATION_SUMMARY_API] Calling backend:', {
      url: BACKEND_URL,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': req.headers.authorization || '',
      }
    });

    const response = await axios.post(`${BACKEND_URL}/conversation_summary`, req.body, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': req.headers.authorization || '',
      },
      timeout: 30000
    });
    
    console.log('🔍 [CONVERSATION_SUMMARY_API] Backend response:', {
      status: response.status,
      data: response.data
    });
    
    res.status(response.status).json(response.data);
  } catch (err: any) {
    if (err.response) {
      res.status(err.response.status).json(err.response.data);
    } else {
      res.status(500).json({ error: 'Proxy error', details: err.message });
    }
  }
} 