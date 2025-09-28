/* eslint-disable @typescript-eslint/no-explicit-any */
import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

const API_BASE = process.env.BACKEND_URL || 'https://beyondwords-express.onrender.com';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();

  try {
    const response = await axios.post(`${API_BASE}/auth/exchange`, req.body, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 15000
    });
    res.status(response.status).json(response.data);
  } catch (error: any) {
    res.status(error.response?.status || 500).json(error.response?.data || { error: 'Exchange failed' });
  }
}

