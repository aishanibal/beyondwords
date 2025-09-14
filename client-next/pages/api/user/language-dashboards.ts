import { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

const BACKEND_URL = process.env.BACKEND_URL || 'https://beyondwords-express.onrender.com/api/user/language-dashboards';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const authHeader = req.headers.authorization || '';
    
    // Handle /api/user/language-dashboards/[language] - GET specific dashboard
    const languageMatch = req.url?.match(/^\/api\/user\/language-dashboards\/([^\/]+)$/);
    if (req.method === 'GET' && languageMatch) {
      const language = languageMatch[1];
      try {
        const response = await axios.get(`${BACKEND_URL}/${language}`, {
          headers: { Authorization: authHeader }
        });
        return res.status(response.status).json(response.data);
      } catch (err: any) {
        if (err.response?.status === 404) {
          return res.status(200).json({ dashboard: null });
        } else {
          return res.status(err.response?.status || 500).json(err.response?.data || { error: 'Failed to fetch language dashboard' });
        }
      }
    }

    // Handle /api/user/language-dashboards - GET all, POST, PUT, DELETEimage.png

    
    if (req.method === 'GET') {
      const response = await axios.get(BACKEND_URL, {
        headers: { Authorization: authHeader }
      });
      return res.status(response.status).json(response.data);
    }
    
    if (req.method === 'POST') {
      const { language, proficiency, talkTopics, learningGoals, practicePreference, isPrimary } = req.body;
      if (!language || !proficiency || !talkTopics || !learningGoals || !practicePreference) {
        return res.status(400).json({ error: 'Missing required fields' });
      }
      const response = await axios.post(BACKEND_URL, {
        language, proficiency, talkTopics, learningGoals, practicePreference, isPrimary
      }, {
        headers: { Authorization: authHeader }
      });
      return res.status(response.status).json(response.data);
    }
    
    if (req.method === 'PUT') {
      const { language, updates } = req.body;
      if (!language || !updates) return res.status(400).json({ error: 'Missing language or updates' });
      const response = await axios.put(`${BACKEND_URL}/${language}`, updates, {
        headers: { Authorization: authHeader }
      });
      return res.status(response.status).json(response.data);
    }
    
    if (req.method === 'DELETE') {
      const { language } = req.body;
      if (!language) return res.status(400).json({ error: 'Missing language' });
      const response = await axios.delete(`${BACKEND_URL}/${language}`, {
        headers: { Authorization: authHeader }
      });
      return res.status(response.status).json(response.data);
    }
    
    return res.status(405).end();
  } catch (error: any) {
    console.error('Language dashboards API error:', error);
    res.status(error.response?.status || 500).json({
      error: error.response?.data?.error || 'Internal server error'
    });
  }
}
