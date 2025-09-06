/* eslint-disable @typescript-eslint/no-explicit-any */
import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { language } = req.query;
  const authHeader = req.headers.authorization || '';
  if (req.method === 'GET') {
    try {
      const response = await axios.get(`http://localhost:4000/api/user/language-dashboards/${language}`, {
        headers: { Authorization: authHeader }
      });
      res.status(response.status).json(response.data);
    } catch (err: any) {
      if (err.response?.status === 404) {
        res.status(200).json({ dashboard: null });
      } else {
        res.status(err.response?.status || 500).json(err.response?.data || { error: 'Failed to fetch language dashboard' });
      }
    }
    return;
  }
  res.status(405).end();
}
