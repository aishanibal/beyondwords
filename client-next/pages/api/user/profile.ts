/* eslint-disable @typescript-eslint/no-explicit-any */
import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const authHeader = req.headers.authorization || '';

  if (req.method === 'GET') {
    try {
      const response = await axios.get('https://beyondwords-express.onrender.com/api/user', {
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
      // Transform the request body to match backend expectations
      const { first_name, last_name, preferences } = req.body;
      const backendData = {
        name: `${first_name || ''} ${last_name || ''}`.trim(),
        email: req.body.email || '',
        preferences
      };
      
      console.log('Next.js API proxy - Original request body:', req.body);
      console.log('Next.js API proxy - Transformed backend data:', backendData);
      
      const response = await axios.put('https://beyondwords-express.onrender.com/api/user/profile', backendData, {
        headers: { Authorization: authHeader }
      });
      // Forward backend status and data
      return res.status(response.status).json(response.data);
    } catch (error: any) {
      console.log('Next.js API proxy - Error response:', error.response?.data);
      // Forward backend error status and data if available
      return res.status(error.response?.status || 500).json(error.response?.data || { error: 'Profile update failed' });
    }
  }

  if (req.method === 'DELETE') {
    try {
      const response = await axios.delete('https://beyondwords-express.onrender.com/api/user', {
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
