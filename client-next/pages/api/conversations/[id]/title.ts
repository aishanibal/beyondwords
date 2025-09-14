import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

// Build backend URL from a known base
const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://beyondwords-express.onrender.com';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;
  const authHeader = req.headers.authorization || '';

  if (!id || Array.isArray(id)) {
    return res.status(400).json({ error: 'Invalid conversation ID' });
  }

  const BACKEND_URL = `${API_BASE}/api/conversations/${id}/title`;

  try {
    if (req.method === 'PUT') {
      console.log('🔄 [API] Handling PUT /api/conversations/[id]/title for ID:', id);
      console.log('🔄 [API] Proxying to backend:', BACKEND_URL);

      const response = await axios.put(BACKEND_URL, req.body, {
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
    res.setHeader('Allow', ['PUT']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);

  } catch (error: any) {
    console.error('❌ [API] Title update proxy error:', error.message);
    
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