/* eslint-disable @typescript-eslint/no-explicit-any */
import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();

  try {
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
    const BACKEND_URL = `${backendUrl}/api/quick_translation`;

    // Forward the quick_translation request to your Express backend
    const response = await axios.post(BACKEND_URL, req.body, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': req.headers.authorization || ''
      }
    });
    
    res.status(response.status).json(response.data);
  } catch (error: any) {
    res.status(error.response?.status || 500).json(error.response?.data || { error: 'Quick translation failed' });
  }
} 