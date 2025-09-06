/* eslint-disable @typescript-eslint/no-explicit-any */
import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

const BACKEND_URL = process.env.BACKEND_URL || 'https://beyondwords-express.onrender.com/api/conversations';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;
  const authHeader = req.headers.authorization || '';

  try {
    const response = await axios.get(`${BACKEND_URL}/${id}`, {
      headers: { Authorization: authHeader }
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