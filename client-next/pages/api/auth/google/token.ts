/* eslint-disable @typescript-eslint/no-explicit-any */
import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();

  try {
    // Forward the Google sign-in request to your Express backend
    const backendUrl = process.env.BACKEND_URL || 'https://beyondwords-express.onrender.com';
    const response = await axios.post(`${backendUrl}/api/auth/google/token`, req.body);
    res.status(response.status).json(response.data);
  } catch (error: any) {
    res.status(error.response?.status || 500).json(error.response?.data || { error: 'Google sign-in failed' });
  }
} 