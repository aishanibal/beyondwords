import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://beyondwords-express.onrender.com';
const BACKEND_URL = `${API_BASE}/api/suggestions`;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const authHeader = req.headers.authorization || '';

  try {
    if (req.method === 'POST') {
      console.log('📝 [API] Handling POST /api/suggestions');
      console.log('📝 [API] Proxying to backend:', BACKEND_URL);

      const response = await axios.post(BACKEND_URL, req.body, {
        headers: {
          Authorization: authHeader,
          'Content-Type': 'application/json'
        },
        timeout: 15000
      });

      console.log('✅ [API] Backend response status:', response.status);
      return res.status(response.status).json(response.data);
    } else {
      return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (err: any) {
    console.error('❌ [API] Suggestions proxy error:', err?.response?.status, err?.message);
    if (err.response) {
      return res.status(err.response.status).json(err.response.data);
    }
    return res.status(500).json({ 
      error: 'Suggestions service unavailable', 
      details: err.message 
    });
  }
}
