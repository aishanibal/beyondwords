import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const authHeader = req.headers.authorization || '';

  if (req.method === 'GET') {
    try {
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

  if (req.method === 'PUT') {
    try {
      const response = await axios.put('http://localhost:4000/api/user', req.body, {
        headers: { Authorization: authHeader }
      });
      // Forward backend status and data
      return res.status(response.status).json(response.data);
    } catch (error: any) {
      // Forward backend error status and data if available
      return res.status(error.response?.status || 500).json(error.response?.data || { error: 'Profile update failed' });
    }
  }

  if (req.method === 'DELETE') {
    try {
      const response = await axios.delete('http://localhost:4000/api/user', {
        headers: { Authorization: authHeader }
      });
      // Forward backend status and data
      return res.status(response.status).json(response.data);
    } catch (error: any) {
      // Forward backend error status and data if available
      return res.status(error.response?.status || 500).json(error.response?.data || { error: 'Account deletion failed' });
    }
  }

  res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
  res.status(405).end(`Method ${req.method} Not Allowed`);
} 