/* eslint-disable @typescript-eslint/no-explicit-any */
import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();

  try {
    // Use environment variable for backend URL, fallback to localhost for development
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
    
    // Ensure proper URL construction without double slashes
    const cleanBackendUrl = backendUrl.endsWith('/') ? backendUrl.slice(0, -1) : backendUrl;
    const googleTokenUrl = `${cleanBackendUrl}/auth/google/token`;
    
    const response = await axios.post(googleTokenUrl, req.body);
    res.status(response.status).json(response.data);
  } catch (error: any) {
    res.status(error.response?.status || 500).json(error.response?.data || { error: 'Google authentication failed' });
  }
} 