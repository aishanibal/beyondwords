import { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { method } = req;
    const backendUrl = 'http://localhost:4000/api/user/language-dashboards';

    switch (method) {
      case 'GET':
        const getResponse = await axios.get(backendUrl, {
          headers: {
            'Authorization': req.headers.authorization || '',
            'Content-Type': 'application/json'
          }
        });
        res.status(200).json(getResponse.data);
        break;

      case 'POST':
        const postResponse = await axios.post(backendUrl, req.body, {
          headers: {
            'Authorization': req.headers.authorization || '',
            'Content-Type': 'application/json'
          }
        });
        res.status(201).json(postResponse.data);
        break;

      case 'PUT':
        const putResponse = await axios.put(backendUrl, req.body, {
          headers: {
            'Authorization': req.headers.authorization || '',
            'Content-Type': 'application/json'
          }
        });
        res.status(200).json(putResponse.data);
        break;

      case 'DELETE':
        const deleteResponse = await axios.delete(backendUrl, {
          headers: {
            'Authorization': req.headers.authorization || '',
            'Content-Type': 'application/json'
          }
        });
        res.status(200).json(deleteResponse.data);
        break;

      default:
        res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
        res.status(405).end(`Method ${method} Not Allowed`);
    }
  } catch (error: any) {
    console.error('Language dashboards API error:', error);
    res.status(error.response?.status || 500).json({
      error: error.response?.data?.error || 'Internal server error'
    });
  }
}
