/* eslint-disable @typescript-eslint/no-explicit-any */
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

const BACKEND_URL = 'http://localhost:4000/api/analyze';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const authHeader = req.headers.authorization || '';

  // Dynamically import formidable and support both CJS and ESM exports
  const formidableModule = await import('formidable');
  const IncomingForm = formidableModule.IncomingForm || (formidableModule.default && formidableModule.default.IncomingForm);
  if (!IncomingForm) {
    console.error('--- [api/analyze] ERROR: Could not load formidable IncomingForm constructor.');
    return res.status(500).json({ error: 'Could not load formidable IncomingForm constructor.' });
  }
  const form = new IncomingForm({ keepExtensions: true });

  form.parse(req, async (err, fields, files) => {
    console.log('--- [api/analyze] FIELDS:', fields);
    console.log('--- [api/analyze] FILES:', files);
    if (err) {
      console.error('--- [api/analyze] FORMIDABLE PARSE ERROR:', err);
      return res.status(400).json({ error: 'Error parsing form data', details: err.message });
    }
    try {
      const formData = new FormData();
      Object.entries(fields).forEach(([key, value]) => {
        if (Array.isArray(value)) {
          value.forEach(v => formData.append(key, v != null ? String(v) : ''));
        } else if (value !== undefined) {
          formData.append(key, String(value));
        }
      });
      let audioFile;
      if (Array.isArray(files.audio)) {
        audioFile = files.audio[0];
      } else if (files.audio) {
        audioFile = files.audio;
      }
      if (audioFile && audioFile.filepath) {
        console.log('--- [api/analyze] SENDING AUDIO FILE:', audioFile.filepath, audioFile.originalFilename);
        const fileStream = fs.createReadStream(audioFile.filepath);
        formData.append('audio', fileStream, {
          filename: audioFile.originalFilename || 'recording.webm',
          contentType: 'audio/webm'
        });
      } else {
        console.log('--- [api/analyze] NO AUDIO FILE TO SEND');
      }
      try {
        const response = await axios.post(BACKEND_URL, formData, {
          headers: {
            ...formData.getHeaders(),
            Authorization: authHeader,
          },
          maxBodyLength: Infinity,
          timeout: 120000, // 2 minutes
        });
        res.status(response.status).json(response.data);
      } catch (axiosError: any) {
        console.error('--- [api/analyze] AXIOS POST ERROR:', axiosError.message, axiosError.response?.data);
        if (axiosError.response) {
          res.status(axiosError.response.status).json(axiosError.response.data);
        } else {
          res.status(500).json({ error: 'Proxy error', details: axiosError.message });
        }
      }
    } catch (error: any) {
      console.error('--- [api/analyze] UNEXPECTED ERROR:', error);
      res.status(500).json({ error: 'Proxy error', details: error.message });
    }
  });
} 