/* eslint-disable @typescript-eslint/no-explicit-any */
import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

const BACKEND_URL = 'http://localhost:4000/api/personas';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const authHeader = req.headers.authorization || '';

  try {
    // RESTful DELETE /api/personas/[id]
    const idMatch = req.url?.match(/^\/api\/personas\/(\d+)/);
    if (req.method === 'DELETE' && idMatch) {
      const id = idMatch[1];
      const response = await axios.delete(`${BACKEND_URL}/${id}`, {
        headers: { Authorization: authHeader }
      });
      return res.status(response.status).json(response.data);
    }

    // GET /api/personas
    if (req.method === 'GET') {
      const response = await axios.get(BACKEND_URL, {
        headers: { Authorization: authHeader }
      });
      return res.status(response.status).json(response.data);
    }

    // POST /api/personas
    if (req.method === 'POST') {
      const response = await axios.post(BACKEND_URL, req.body, {
        headers: { Authorization: authHeader }
      });
      return res.status(response.status).json(response.data);
    }

    // Fallback for unsupported methods
    res.setHeader('Allow', ['GET', 'POST', 'DELETE']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  } catch (err: any) {
    if (err.response) {
      return res.status(err.response.status).json(err.response.data);
    }
    res.status(500).json({ error: 'Proxy error', details: err.message });
  }
} 