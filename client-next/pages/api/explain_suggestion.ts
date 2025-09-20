/* eslint-disable @typescript-eslint/no-explicit-any */
import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

const BACKEND_URL = process.env.AI_BACKEND_URL || 'https://beyondwords.onrender.com';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {
    // Handle authentication - if no token provided, try without auth
    const authHeader = req.headers.authorization;
    const headers: any = {
      'Content-Type': 'application/json',
    };
    
    if (authHeader && authHeader !== '') {
      headers['Authorization'] = authHeader;
    }
    
    const response = await axios.post(`${BACKEND_URL}/explain_suggestion`, req.body, {
      headers,
      timeout: 30000
    });
    
    res.status(response.status).json(response.data);
  } catch (err: any) {
    console.error('Explain suggestion API error:', err);
    
    if (err.response) {
      res.status(err.response.status).json(err.response.data);
    } else {
      res.status(500).json({ 
        error: 'Failed to explain suggestion', 
        details: err.message 
      });
    }
  }
}
