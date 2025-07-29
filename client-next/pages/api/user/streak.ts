/* eslint-disable @typescript-eslint/no-explicit-any */
import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).end();
  const { userId, language } = req.query;
  if (!userId || !language) return res.status(400).json({ error: 'Missing user or language' });
  try {
    const response = await axios.get('http://localhost:4000/api/user/streak', {
      params: { userId, language }
    });
    res.json(response.data);
  } catch (err: any) {
    if (err.response?.status === 404) {
      // No streak yet, return 0
      res.status(200).json({ streak: 0 });
    } else {
      res.status(500).json({ error: err.message });
    }
  }
} 