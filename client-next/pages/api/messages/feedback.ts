/* eslint-disable @typescript-eslint/no-explicit-any */
import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();
  const { messageId, feedback } = req.body;
  if (!messageId || !feedback) {
    return res.status(400).json({ error: 'Missing messageId or feedback' });
  }
  try {
    const response = await axios.post('https://beyondwords-express.onrender.com/api/messages/feedback', { messageId, feedback });
    res.json(response.data);
  } catch (error: any) {
    res.status(500).json({ error: 'Error storing feedback', details: error.message });
  }
} 