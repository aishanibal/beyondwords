/* eslint-disable @typescript-eslint/no-explicit-any */
import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

const BACKEND_URL = 'http://localhost:5000/ai_response';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  console.log('--- [api/ai_response] REQUEST BODY:', req.body);

  try {
    const response = await axios.post(BACKEND_URL, req.body, {
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 120000, // 2 minutes
    });
    
    console.log('--- [api/ai_response] PYTHON RESPONSE:', response.data);
    res.status(response.status).json(response.data);
  } catch (error: any) {
    console.error('--- [api/ai_response] ERROR:', error.message);
    if (axios.isAxiosError(error)) {
      console.error('--- [api/ai_response] AXIOS ERROR DETAILS:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message
      });
    }
    res.status(500).json({ error: 'Proxy error', details: error.message });
  }
} 