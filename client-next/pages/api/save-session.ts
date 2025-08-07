/* eslint-disable @typescript-eslint/no-explicit-any */
import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

const BACKEND_URL = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/save-session`;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {
    const { chatHistory, language } = req.body;
    
    if (!chatHistory || !Array.isArray(chatHistory)) {
      return res.status(400).json({ error: 'Chat history is required and must be an array' });
    }

    // Get JWT token from request headers
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ error: 'Authentication token required' });
    }
    
    const response = await axios.post(BACKEND_URL, {
      chatHistory,
      language: language || 'en'
    }, {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` })
      },
      timeout: 30000
    });

    res.status(response.status).json(response.data);
  } catch (error: any) {
    console.error('Save session error:', error);
    
    if (error.response) {
      // Forward the error response from the backend
      res.status(error.response.status).json(error.response.data);
    } else {
      res.status(500).json({ 
        error: 'Failed to save session', 
        details: error.message 
      });
    }
  }
}
 