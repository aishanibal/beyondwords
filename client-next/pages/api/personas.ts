/* eslint-disable @typescript-eslint/no-explicit-any */
import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  process.env.BACKEND_URL ||
  process.env.AI_BACKEND_URL ||
  'https://beyondwords.onrender.com';
const BACKEND_URL = `${API_BASE}/api/personas`;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const authHeader = req.headers.authorization || '';

  try {
    if (req.method === 'DELETE') {
      const { id } = req.query;
      const response = await axios.delete(`${BACKEND_URL}/${id}`, {
        headers: { Authorization: authHeader }
      });
      return res.status(response.status).json(response.data);
    }

    if (req.method === 'GET') {
      const response = await axios.get(BACKEND_URL, {
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

    res.setHeader('Allow', ['GET', 'POST', 'DELETE']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  } catch (err: any) {
    if (err.response) {
      return res.status(err.response.status).json(err.response.data);
    }
    res.status(500).json({ error: 'Proxy error', details: err.message });
  }
} 