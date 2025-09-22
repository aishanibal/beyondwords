/* eslint-disable @typescript-eslint/no-explicit-any */
import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

const PRIMARY_BASE =
  process.env.BACKEND_URL ||
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  process.env.AI_BACKEND_URL ||
  'https://beyondwords-express.onrender.com';
const FALLBACK_BASE = 'https://beyondwords.onrender.com';
const PRIMARY_URL = `${PRIMARY_BASE}/api/personas`;
const FALLBACK_URL = `${FALLBACK_BASE}/api/personas`;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const authHeader = req.headers.authorization || '';

  try {
    if (req.method === 'DELETE') {
      const { id } = req.query;
      console.log('🔍 [PERSONAS_API] DELETE proxy', { id, primary: `${PRIMARY_URL}/${id}` });
      let response;
      try {
        response = await axios.delete(`${PRIMARY_URL}/${id}`, { headers: { Authorization: authHeader }, timeout: 15000 });
      } catch (e: any) {
        if (e.response?.status === 404 || e.code === 'ECONNREFUSED') {
          console.warn('🔍 [PERSONAS_API] Primary DELETE failed, trying fallback', { fallback: `${FALLBACK_URL}/${id}` });
          response = await axios.delete(`${FALLBACK_URL}/${id}`, { headers: { Authorization: authHeader }, timeout: 15000 });
        } else {
          throw e;
        }
      }
      return res.status(response.status).json(response.data);
    }

    if (req.method === 'GET') {
      console.log('🔍 [PERSONAS_API] GET proxy', { primary: PRIMARY_URL });
      let response;
      try {
        response = await axios.get(PRIMARY_URL, { headers: { Authorization: authHeader }, timeout: 15000 });
      } catch (e: any) {
        if (e.response?.status === 404 || e.code === 'ECONNREFUSED') {
          console.warn('🔍 [PERSONAS_API] Primary GET failed, trying fallback', { fallback: FALLBACK_URL });
          response = await axios.get(FALLBACK_URL, { headers: { Authorization: authHeader }, timeout: 15000 });
        } else {
          throw e;
        }
      }
      return res.status(response.status).json(response.data);
    }

    if (req.method === 'POST') {
      console.log('🔍 [PERSONAS_API] POST proxy', { primary: PRIMARY_URL, hasAuth: !!authHeader });
      let response;
      try {
        response = await axios.post(PRIMARY_URL, req.body, { headers: { Authorization: authHeader, 'Content-Type': 'application/json' }, timeout: 15000 });
      } catch (e: any) {
        if (e.response?.status === 404 || e.code === 'ECONNREFUSED') {
          console.warn('🔍 [PERSONAS_API] Primary POST failed, trying fallback', { fallback: FALLBACK_URL });
          response = await axios.post(FALLBACK_URL, req.body, { headers: { Authorization: authHeader, 'Content-Type': 'application/json' }, timeout: 15000 });
        } else {
          throw e;
        }
      }
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