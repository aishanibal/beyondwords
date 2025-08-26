/* eslint-disable @typescript-eslint/no-explicit-any */
import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

const BACKEND_URL = process.env.AI_BACKEND_URL || 'http://localhost:5000/conversation_summary';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {
    const response = await axios.post(BACKEND_URL, {
      conversation_id: req.body.conversation_id,
      messages: req.body.messages,
      language: req.body.language
    }, {
      headers: {
        'Content-Type': 'application/json',
      }
    });
    res.status(response.status).json(response.data);
  } catch (err: any) {
    if (err.response) {
      res.status(err.response.status).json(err.response.data);
    } else {
      res.status(500).json({ error: 'Proxy error', details: err.message });
    }
  }
} 