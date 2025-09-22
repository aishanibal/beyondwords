/* eslint-disable @typescript-eslint/no-explicit-any */
import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

const BACKEND_URL = process.env.BACKEND_URL || 'https://beyondwords-express.onrender.com';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {
    const authHeader = req.headers.authorization || '';
    const primaryUrl = `${BACKEND_URL}/api/feedback`;
    const fallbackUrl = `${BACKEND_URL}/api/feedback`; // no unprotected variant; still try primary

    console.log('🔍 [FEEDBACK_API] Proxying to backend:', { url: primaryUrl, hasAuth: !!authHeader });

    let response;
    try {
      response = await axios.post(primaryUrl, req.body, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authHeader,
        },
        timeout: 120000
      });
    } catch (primaryErr: any) {
      const status = primaryErr?.response?.status;
      console.warn('🔍 [FEEDBACK_API] Primary call failed:', status, primaryErr?.response?.data);
      // If no auth or auth-related failure, attempt without Authorization (optional auth backend may accept)
      if (!authHeader || status === 401 || status === 403) {
        response = await axios.post(fallbackUrl, req.body, {
          headers: { 'Content-Type': 'application/json' },
          timeout: 120000
        });
      } else {
        throw primaryErr;
      }
    }

    res.status(response.status).json(response.data);
  } catch (err: any) {
    console.error('🔍 [FEEDBACK_API] Error:', err);
    if (err.response) {
      res.status(err.response.status).json(err.response.data);
    } else {
      res.status(500).json({ error: 'Failed to get detailed feedback', details: err.message });
    }
  }
}


