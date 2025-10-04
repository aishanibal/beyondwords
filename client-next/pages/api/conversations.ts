/* eslint-disable @typescript-eslint/no-explicit-any */
import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

// Build backend URL from a known base. Avoid using a misconfigured BACKEND_URL that could be '/'
const API_BASE = (() => {
  const base = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://beyondwords-express.onrender.com';
  // Remove trailing slash to prevent double slashes
  return base.replace(/\/$/, '');
})();
const BACKEND_URL = `${API_BASE}/api/conversations`;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const authHeader = req.headers.authorization || '';

  try {
    // Handle /api/conversations/[id] - GET specific conversation
    const url = req.url || '';
    const idMatch = url.match(/^\/api\/conversations\/(\d+)$/);
    
    if (req.method === 'GET' && idMatch) {
      const id = idMatch[1];
      console.log('🔍 [API] Handling GET /api/conversations/[id] for ID:', id);
      console.log('🔍 [API] Proxying to backend:', `${BACKEND_URL}/${id}`);
      
      try {
        const response = await axios.get(`${BACKEND_URL}/${id}`, {
          headers: { Authorization: authHeader }
        });
        console.log('🔍 [API] Backend response status:', response.status);
        return res.status(response.status).json(response.data);
      } catch (err: any) {
        console.error('🔍 [API] Backend error:', err?.response?.status, err?.message);
        if (err.response) {
          return res.status(err.response.status).json(err.response.data);
        }
        return res.status(500).json({ error: 'Proxy error', details: err.message });
      }
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