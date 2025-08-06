/* eslint-disable @typescript-eslint/no-explicit-any */
import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const authHeader = req.headers.authorization || '';
  const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

  try {
    // GET /api/user/language-dashboards
    if (req.method === 'GET') {
      const response = await axios.get(`${backendUrl}/api/user/language-dashboards`, {
        headers: { Authorization: authHeader }
      });
      return res.status(response.status).json(response.data);
    }

    // POST /api/user/language-dashboards
    if (req.method === 'POST') {
      const response = await axios.post(`${backendUrl}/api/user/language-dashboards`, req.body, {
        headers: { Authorization: authHeader }
      });
      return res.status(response.status).json(response.data);
    }

    // PUT /api/user/language-dashboards
    if (req.method === 'PUT') {
      const response = await axios.put(`${backendUrl}/api/user/language-dashboards`, req.body, {
        headers: { Authorization: authHeader }
      });
      return res.status(response.status).json(response.data);
    }

    // DELETE /api/user/language-dashboards
    if (req.method === 'DELETE') {
      const response = await axios.delete(`${backendUrl}/api/user/language-dashboards`, {
        headers: { Authorization: authHeader }
      });
      return res.status(response.status).json(response.data);
    }

    // Fallback for unsupported methods
    res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  } catch (err: any) {
    if (err.response) {
      return res.status(err.response.status).json(err.response.data);
    }
    res.status(500).json({ error: 'Proxy error', details: err.message });
  }
} 