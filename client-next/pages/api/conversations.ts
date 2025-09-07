/* eslint-disable @typescript-eslint/no-explicit-any */
import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

const BACKEND_URL = process.env.BACKEND_URL || 'https://beyondwords-express.onrender.com/api/conversations';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const authHeader = req.headers.authorization || '';

  try {
    // Handle /api/conversations/[id] - GET specific conversation
    const idMatch = req.url?.match(/^\/api\/conversations\/(\d+)$/);
    if (req.method === 'GET' && idMatch) {
      const id = idMatch[1];
      const response = await axios.get(`${BACKEND_URL}/${id}`, {
        headers: { Authorization: authHeader }
      });
      return res.status(response.status).json(response.data);
    }

    // Handle /api/conversations/[id]/title - PUT update conversation title
    const titleMatch = req.url?.match(/^\/api\/conversations\/(\d+)\/title$/);
    if (req.method === 'PUT' && titleMatch) {
      const id = titleMatch[1];
      const response = await axios.put(`${BACKEND_URL}/${id}/title`, req.body, {
        headers: { Authorization: authHeader }
      });
      return res.status(response.status).json(response.data);
    }

    // Handle /api/conversations - GET all conversations or POST new conversation
    if (req.method === 'GET') {
      const { language } = req.query;
      const response = await axios.get(BACKEND_URL, {
        params: language ? { language } : {},
        headers: { Authorization: authHeader }
      });
      return res.status(response.status).json(response.data);
    }

    if (req.method === 'POST') {
      const response = await axios.post(BACKEND_URL, req.body, {
        headers: { Authorization: authHeader }
      });
      return res.status(response.status).json(response.data);
    }

    // Fallback for unsupported methods
    res.setHeader('Allow', ['GET', 'POST', 'PUT']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  } catch (err: any) {
    if (err.response) {
      return res.status(err.response.status).json(err.response.data);
    }
    res.status(500).json({ error: 'Proxy error', details: err.message });
  }
} 