import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

const BACKEND_URL = 'http://localhost:4000/api/conversations';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const authHeader = req.headers.authorization || '';

  try {
    // RESTful GET /api/conversations/[id]
    // Next.js API routes will pass the id as req.query.id if the route is /api/conversations/[id].ts
    // But if this is a catch-all or single file, parse the URL
    const idMatch = req.url?.match(/^\/api\/conversations\/(\d+)/);
    if (req.method === 'GET' && idMatch) {
      const id = idMatch[1];
      const response = await axios.get(`${BACKEND_URL}/${id}`, {
        headers: { Authorization: authHeader }
      });
      return res.status(response.status).json(response.data);
    }

    // GET /api/conversations?language=xx
    if (req.method === 'GET') {
      const { language } = req.query;
      const response = await axios.get(BACKEND_URL, {
        params: language ? { language } : {},
        headers: { Authorization: authHeader }
      });
      return res.status(response.status).json(response.data);
    }

    // POST /api/conversations
    if (req.method === 'POST') {
      const response = await axios.post(BACKEND_URL, req.body, {
        headers: { Authorization: authHeader }
      });
      return res.status(response.status).json(response.data);
    }

    // Fallback for unsupported methods
    res.setHeader('Allow', ['GET', 'POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  } catch (err: any) {
    if (err.response) {
      return res.status(err.response.status).json(err.response.data);
    }
    res.status(500).json({ error: 'Proxy error', details: err.message });
  }
} 