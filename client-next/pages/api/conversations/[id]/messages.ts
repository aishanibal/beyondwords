/* eslint-disable @typescript-eslint/no-explicit-any */
import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

// Build backend URL from a known base
const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://beyondwords-express.onrender.com';
const BACKEND_URL = `${API_BASE}/api/conversations`;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const authHeader = req.headers.authorization || '';
  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid conversation ID' });
  }

  try {
    if (req.method === 'POST') {
      // POST /api/conversations/[id]/messages - Add message to conversation
      const response = await axios.post(`${BACKEND_URL}/${id}/messages`, req.body, {
        headers: { Authorization: authHeader }
      });
      return res.status(response.status).json(response.data);
    }

    // Method not allowed
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  } catch (err: any) {
    console.error(`[API] Error proxying conversation ${id} messages:`, err.message);
    if (err.response) {
      return res.status(err.response.status).json(err.response.data);
    }
    res.status(500).json({ error: 'Proxy error', details: err.message });
  }
}
