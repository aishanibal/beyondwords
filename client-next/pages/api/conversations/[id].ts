/* eslint-disable @typescript-eslint/no-explicit-any */
import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://beyondwords-express.onrender.com';
const BACKEND_URL = `${API_BASE}/api/conversations`;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const authHeader = req.headers.authorization || '';
  const { id } = req.query;

  console.log('🔍 [API:id] Conversations dynamic route hit', { method: req.method, id });

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid conversation ID' });
  }

  try {
    if (req.method === 'GET') {
      console.log('🔍 [API:id] Proxy GET →', `${BACKEND_URL}/${id}`);
      const response = await axios.get(`${BACKEND_URL}/${id}`, {
        headers: { Authorization: authHeader }
      });
      return res.status(response.status).json(response.data);
    }

    if (req.method === 'PUT') {
      console.log('🔍 [API:id] Proxy PUT →', `${BACKEND_URL}/${id}`);
      const response = await axios.put(`${BACKEND_URL}/${id}`, req.body, {
        headers: { Authorization: authHeader }
      });
      return res.status(response.status).json(response.data);
    }

    if (req.method === 'DELETE') {
      console.log('🔍 [API:id] Proxy DELETE →', `${BACKEND_URL}/${id}`);
      const response = await axios.delete(`${BACKEND_URL}/${id}`, {
        headers: { Authorization: authHeader }
      });
      return res.status(response.status).json(response.data);
    }

    res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  } catch (err: any) {
    console.error(`[API:id] Error proxying conversation ${id}:`, err?.response?.status, err?.message);
    if (err.response) {
      return res.status(err.response.status).json(err.response.data);
    }
    res.status(500).json({ error: 'Proxy error', details: err.message });
  }
}


