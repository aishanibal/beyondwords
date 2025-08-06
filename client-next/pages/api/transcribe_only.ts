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

const BACKEND_URL = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/analyze`;

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
    console.error('--- [api/transcribe_only] ERROR: Could not load formidable IncomingForm constructor.');
    return res.status(500).json({ error: 'Could not load formidable IncomingForm constructor.' });
  }
  const form = new IncomingForm({ keepExtensions: true });

  form.parse(req, async (err, fields, files) => {
    console.log('--- [api/transcribe_only] FIELDS:', fields);
    console.log('--- [api/transcribe_only] FILES:', files);
    if (err) {
      console.error('--- [api/transcribe_only] FORMIDABLE PARSE ERROR:', err);
      return res.status(400).json({ error: 'Error parsing form data', details: err.message });
    }
    
    try {
      let audioFile;
      if (Array.isArray(files.audio)) {
        audioFile = files.audio[0];
      } else if (files.audio) {
        audioFile = files.audio;
      }
      
      if (!audioFile || !audioFile.filepath) {
        return res.status(400).json({ error: 'No audio file provided' });
      }
      
      // Handle language field which might be an array
      const languageField = fields.language;
      const language = Array.isArray(languageField) ? languageField[0] : languageField || 'en';
      
      // Create form data for Express server
      const formData = new FormData();
      const fileStream = fs.createReadStream(audioFile.filepath);
      formData.append('audio', fileStream, {
        filename: audioFile.originalFilename || 'recording.webm',
        contentType: 'audio/webm'
      });
      formData.append('language', language);
      
      console.log('--- [api/transcribe_only] SENDING TO EXPRESS:', { language, audioFile: audioFile.originalFilename });
      
      const response = await axios.post(BACKEND_URL, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: authHeader,
        },
        maxBodyLength: Infinity,
        timeout: 120000, // 2 minutes
      });
      
      console.log('--- [api/transcribe_only] EXPRESS RESPONSE STATUS:', response.status);
      console.log('--- [api/transcribe_only] EXPRESS RESPONSE DATA:', response.data);
      
      // Extract just the transcription from the Express response
      const transcription = response.data.transcription || '';
      
      res.status(200).json({
        transcription: transcription,
        success: true
      });
    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        console.error('--- [api/transcribe_only] AXIOS POST ERROR:', error.message, error.response?.data);
        if (error.response) {
          res.status(error.response.status).json(error.response.data);
        } else {
          res.status(500).json({ error: 'Proxy error', details: error.message });
        }
      } else {
        console.error('--- [api/transcribe_only] UNEXPECTED ERROR:', error);
        res.status(500).json({ error: 'Proxy error', details: error.message });
      }
    }
  });
} 