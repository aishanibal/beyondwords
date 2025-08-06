/* eslint-disable @typescript-eslint/no-explicit-any */
import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();

  try {
    const { messageId, feedback } = req.body;
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
    
    if (!messageId || !feedback) {
      return res.status(400).json({ error: 'Missing messageId or feedback' });
    }

    const response = await axios.post(`${backendUrl}/messages/feedback`, { messageId, feedback });
    res.status(response.status).json(response.data);
  } catch (error: any) {
    res.status(error.response?.status || 500).json(error.response?.data || { error: 'Feedback submission failed' });
  }
} 