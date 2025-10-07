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
  const { id } = req.query;
  const authHeader = req.headers.authorization || '';

  if (!id || Array.isArray(id)) {
    return res.status(400).json({ error: 'Invalid conversation ID' });
  }

  const BACKEND_URL = `${API_BASE}/api/conversations/${id}/messages`;

  try {
    if (req.method === 'GET') {
      console.log('🔄 [API] Handling GET /api/conversations/[id]/messages for ID:', id);
      console.log('🔄 [API] Proxying to backend:', BACKEND_URL);

      const response = await axios.get(BACKEND_URL, {
        headers: { Authorization: authHeader },
        timeout: 15000
      });

      console.log('✅ [API] Backend response status:', response.status);
      return res.status(response.status).json(response.data);
    }

    if (req.method === 'POST') {
      console.log('🔄 [API] Handling POST /api/conversations/[id]/messages for ID:', id);
      console.log('🔄 [API] Proxying to backend:', BACKEND_URL);
      console.log('🔄 [API] Request body:', req.body);

      const response = await axios.post(BACKEND_URL, req.body, {
        headers: { 
          Authorization: authHeader,
          'Content-Type': 'application/json'
        },
        timeout: 15000
      });

      console.log('✅ [API] Backend response status:', response.status);
      return res.status(response.status).json(response.data);
    }

    // Method not allowed
    res.setHeader('Allow', ['GET', 'POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);

  } catch (error: any) {
    console.error('❌ [API] Conversation messages proxy error:', error.message);
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
