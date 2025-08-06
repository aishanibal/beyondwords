/* eslint-disable @typescript-eslint/no-explicit-any */
import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

const BACKEND_URL = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/conversations`;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const authHeader = req.headers.authorization || '';

  try {
    // RESTful DELETE /api/conversations/[id]
    const idMatch = req.url?.match(/^\/api\/conversations\/(\d+)/);
    if (req.method === 'DELETE' && idMatch) {
      const id = idMatch[1];
      const response = await axios.delete(`${BACKEND_URL}/${id}`, {
        headers: { Authorization: authHeader }
      });
      return res.status(response.status).json(response.data);
    }

    // GET /api/conversations/[id]
    if (req.method === 'GET' && idMatch) {
      const id = idMatch[1];
      const response = await axios.get(`${BACKEND_URL}/${id}`, {
        headers: { Authorization: authHeader }
      });
      return res.status(response.status).json(response.data);
    }

    // PUT /api/conversations/[id]
    if (req.method === 'PUT' && idMatch) {
      const id = idMatch[1];
      const response = await axios.put(`${BACKEND_URL}/${id}`, req.body, {
        headers: { Authorization: authHeader }
      });
      return res.status(response.status).json(response.data);
    }

    // Fallback for unsupported methods
    res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  } catch (err: any) {
    if (err.response) {
      return res.status(err.response.status).json(err.response.data);
    }
    res.status(500).json({ error: 'Proxy error', details: err.message });
  }
} 