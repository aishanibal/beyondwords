/* eslint-disable @typescript-eslint/no-explicit-any */
import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();

  try {
    // Use environment variable for backend URL, fallback to localhost for development
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
    
    console.log('🔍 Login request - Backend URL:', backendUrl);
    
    const response = await axios.post(`${backendUrl}/auth/login`, req.body, {
      timeout: 10000, // 10 second timeout
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Login successful - Status:', response.status);
    res.status(response.status).json(response.data);
  } catch (error: any) {
    console.error('❌ Login error:', error.message);
    
    if (error.code === 'ECONNABORTED') {
      return res.status(408).json({ error: 'Login timeout - please try again' });
    }
    
    if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      return res.status(503).json({ error: 'Backend service unavailable - please try again later' });
    }
    
    if (error.response) {
      console.error('❌ Backend error response:', error.response.status, error.response.data);
      return res.status(error.response.status).json(error.response.data);
    }
    
    console.error('❌ Unknown error:', error);
    res.status(500).json({ error: 'Login failed - please try again' });
  }
} 