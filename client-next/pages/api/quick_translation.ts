/* eslint-disable @typescript-eslint/no-explicit-any */
import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

// Prefer explicit AI backend base; fallback to Render Express URL
const BACKEND_URL = process.env.BACKEND_URL || 'https://beyondwords-express.onrender.com';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {
    // Forward optional auth header
    const authHeader = req.headers.authorization;
    const headers: any = { 'Content-Type': 'application/json' };
    if (authHeader && authHeader !== '') headers['Authorization'] = authHeader;

    const url = `${BACKEND_URL}/api/quick_translation`;
    console.log('🔍 [QUICK_TRANSLATION_API] Proxying request to:', url);

    const response = await axios.post(url, req.body, { headers, timeout: 30000 });
    return res.status(response.status).json(response.data);
  } catch (err: any) {
    console.error('🔍 [QUICK_TRANSLATION_API] Error:', err?.message || err);
    if (err.response) {
      return res.status(err.response.status).json(err.response.data);
    }
    return res.status(500).json({ error: 'Failed to get quick translation', details: err.message });
  }
}


