/* eslint-disable @typescript-eslint/no-explicit-any */
import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      const authHeader = req.headers.authorization || '';
      const response = await axios.get('http://localhost:4000/api/user', {
        headers: { Authorization: authHeader }
      });
      // Forward backend status and data
      return res.status(response.status).json(response.data);
    } catch (error: any) {
      // Forward backend error status and data if available
      return res.status(error.response?.status || 500).json(error.response?.data || { error: 'Profile fetch failed' });
    }
  }
  res.setHeader('Allow', ['GET']);
  res.status(405).end(`Method ${req.method} Not Allowed`);
} 