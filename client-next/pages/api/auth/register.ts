/* eslint-disable @typescript-eslint/no-explicit-any */
import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log('🔍 Register API route called - Method:', req.method);
  console.log('🔍 Register API route called - URL:', req.url);
  console.log('🔍 Register API route called - Headers:', req.headers);
  
  if (req.method !== 'POST') return res.status(405).end();

  try {
    // Use environment variable for backend URL, fallback to localhost for development
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
    
    // Ensure proper URL construction without double slashes
    const cleanBackendUrl = backendUrl.endsWith('/') ? backendUrl.slice(0, -1) : backendUrl;
    const registerUrl = `${cleanBackendUrl}/auth/register`;
    
    console.log('🔍 Registration request - Backend URL:', cleanBackendUrl);
    console.log('🔍 Registration request - Full URL:', registerUrl);
    console.log('🔍 Registration request - Body:', req.body);
    
    const response = await axios.post(registerUrl, req.body, {
      timeout: 10000, // 10 second timeout
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Registration successful - Status:', response.status);
    res.status(response.status).json(response.data);
  } catch (error: any) {
    console.error('❌ Registration error:', error.message);
    
    if (error.code === 'ECONNABORTED') {
      return res.status(408).json({ error: 'Registration timeout - please try again' });
    }
    
    if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      return res.status(503).json({ error: 'Backend service unavailable - please try again later' });
    }
    
    if (error.response) {
      console.error('❌ Backend error response:', error.response.status, error.response.data);
      return res.status(error.response.status).json(error.response.data);
    }
    
    console.error('❌ Unknown error:', error);
    res.status(500).json({ error: 'Registration failed - please try again' });
  }
} 