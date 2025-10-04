/* eslint-disable @typescript-eslint/no-explicit-any */
import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';
import fs from 'fs';
import FormData from 'form-data';

export const config = {
  api: {
    bodyParser: false,
  },
};

const BACKEND_URL = (process.env.BACKEND_URL || 'https://beyondwords-express.onrender.com').replace(/\/$/, '') + '/api/analyze';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {
    const formData = new FormData();
    
    // Add audio file
    if (req.body.audio) {
      formData.append('audio', req.body.audio);
    }
    
    // Add other fields
    Object.keys(req.body).forEach(key => {
      if (key !== 'audio' && req.body[key] !== undefined) {
        formData.append(key, req.body[key]);
      }
    });

    const response = await axios.post(BACKEND_URL, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        ...formData.getHeaders?.() || {}
      }
    });

    res.status(response.status).json(response.data);
  } catch (err: any) {
    console.error('Analyze API error:', err);
    
    if (err.response) {
      res.status(err.response.status).json(err.response.data);
    } else {
      res.status(500).json({ 
        error: 'Proxy error', 
        details: err.message,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
      });
    }
  }
} 