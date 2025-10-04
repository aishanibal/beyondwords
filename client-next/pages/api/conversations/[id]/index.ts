import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

// Build backend URL from envs (prefer server BACKEND_URL)
const API_BASE = (() => {
  const base = process.env.BACKEND_URL ||
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    process.env.AI_BACKEND_URL ||
    'https://beyondwords-express.onrender.com';
  
  // Remove trailing slash to prevent double slashes
  return base.replace(/\/$/, '');
})();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id, limit, offset } = req.query;
  const authHeader = req.headers.authorization || '';

  if (!id || Array.isArray(id)) {
    return res.status(400).json({ error: 'Invalid conversation ID' });
  }

  // Build URL with query parameters if provided
  let BACKEND_URL = `${API_BASE}/api/conversations/${id}`;
  const queryParams = new URLSearchParams();
  if (limit) queryParams.append('limit', limit as string);
  if (offset) queryParams.append('offset', offset as string);
  if (queryParams.toString()) {
    BACKEND_URL += `?${queryParams.toString()}`;
  }

  try {
    if (req.method === 'GET') {
      console.log('🔄 [API] Handling GET /api/conversations/[id] for ID:', id);
      console.log('🔄 [API] Proxying to backend:', BACKEND_URL);

      const response = await axios.get(BACKEND_URL, {
        headers: { Authorization: authHeader },
        timeout: 15000
      });

      console.log('✅ [API] Backend response status:', response.status);
      return res.status(response.status).json(response.data);
    }

    if (req.method === 'PATCH') {
      console.log('🔄 [API] Handling PATCH /api/conversations/[id] for ID:', id);
      console.log('🔄 [API] Proxying to backend:', `${API_BASE}/api/conversations/${id}`);

      const response = await axios.patch(`${API_BASE}/api/conversations/${id}`, req.body, {
        headers: { 
          Authorization: authHeader,
          'Content-Type': 'application/json'
        },
        timeout: 15000
      });

      console.log('✅ [API] Backend response status:', response.status);
      return res.status(response.status).json(response.data);
    }

    if (req.method === 'DELETE') {
      console.log('🔄 [API] Handling DELETE /api/conversations/[id] for ID:', id);
      console.log('🔄 [API] Proxying to backend:', `${API_BASE}/api/conversations/${id}`);

      const response = await axios.delete(`${API_BASE}/api/conversations/${id}`, {
        headers: { Authorization: authHeader },
        timeout: 15000
      });

      console.log('✅ [API] Backend response status:', response.status);
      return res.status(response.status).json(response.data);
    }

    // Method not allowed
    res.setHeader('Allow', ['GET', 'PATCH', 'DELETE']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);

  } catch (error: any) {
    console.error('❌ [API] Conversation proxy error:', error.message);
    console.error('❌ [API] Backend URL was:', BACKEND_URL);
    
    if (error.response) {
      console.error('❌ [API] Backend error response:', error.response.status, error.response.data);
      return res.status(error.response.status).json(error.response.data);
    }
    
    return res.status(500).json({ 
      error: 'Proxy error', 
      details: error.message,
      backendUrl: BACKEND_URL
    });
  }
}