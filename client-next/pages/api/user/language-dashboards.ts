/* eslint-disable @typescript-eslint/no-explicit-any */
import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const authHeader = req.headers.authorization || '';

  try {
    if (req.method === 'GET') {
      // Forward GET to backend, with Authorization header
      const response = await axios.get('http://localhost:4000/api/user/language-dashboards', {
        headers: { Authorization: authHeader }
      });
      return res.status(response.status).json(response.data);
    }
    if (req.method === 'POST') {
      const { language, proficiency, talkTopics, learningGoals, practicePreference, isPrimary } = req.body;
      if (!language || !proficiency || !talkTopics || !learningGoals || !practicePreference) {
        return res.status(400).json({ error: 'Missing required fields' });
      }
      const response = await axios.post('http://localhost:4000/api/user/language-dashboards', {
        language, proficiency, talkTopics, learningGoals, practicePreference, isPrimary
      }, {
        headers: { Authorization: authHeader }
      });
      return res.status(response.status).json(response.data);
    }
    if (req.method === 'PUT') {
      const { language, updates } = req.body;
      if (!language || !updates) return res.status(400).json({ error: 'Missing language or updates' });
      const response = await axios.put('http://localhost:4000/api/user/language-dashboards', {
        language, updates
      }, {
        headers: { Authorization: authHeader }
      });
      return res.status(response.status).json(response.data);
    }
    if (req.method === 'DELETE') {
      const { language } = req.body;
      if (!language) return res.status(400).json({ error: 'Missing language' });
      const response = await axios.delete('http://localhost:4000/api/user/language-dashboards', {
        data: { language },
        headers: { Authorization: authHeader }
      });
      return res.status(response.status).json(response.data);
    }
    return res.status(405).end();
  } catch (error: any) {
    res.status(error.response?.status || 500).json(error.response?.data || { error: 'Failed to process language dashboard request' });
  }
} 