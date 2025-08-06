/* eslint-disable @typescript-eslint/no-explicit-any */
import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const authHeader = req.headers.authorization || '';
  const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

  try {
    // GET /api/user/streak
    if (req.method === 'GET') {
      // Forward query parameters to backend
      const queryParams = new URLSearchParams(req.query as Record<string, string>).toString();
      const url = queryParams ? `${backendUrl}/api/user/streak?${queryParams}` : `${backendUrl}/api/user/streak`;
      
      const response = await axios.get(url, {
        headers: { Authorization: authHeader }
      });
      return res.status(response.status).json(response.data);
    }

    // Fallback for unsupported methods
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  } catch (err: any) {
    if (err.response) {
      return res.status(err.response.status).json(err.response.data);
    }
    res.status(500).json({ error: 'Proxy error', details: err.message });
  }
} 