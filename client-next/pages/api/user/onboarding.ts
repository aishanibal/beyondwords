/* eslint-disable @typescript-eslint/no-explicit-any */
import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();

  try {
    // Forward the onboarding request to your backend (correct path and headers)
    const response = await axios.post('http://localhost:4000/api/user/onboarding', req.body, {
      headers: { Authorization: req.headers.authorization || '' }
    });
    res.status(response.status).json(response.data);
  } catch (error: any) {
    res.status(error.response?.status || 500).json(error.response?.data || { error: 'Onboarding failed' });
  }
} 