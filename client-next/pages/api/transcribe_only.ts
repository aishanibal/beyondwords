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

const BACKEND_URL = 'http://localhost:5000/transcribe_only';

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
        console.log('--- [api/transcribe_only] SENDING AUDIO FILE:', audioFile.filepath, audioFile.originalFilename);
        const fileStream = fs.createReadStream(audioFile.filepath);
        formData.append('audio', fileStream, {
          filename: audioFile.originalFilename || 'recording.webm',
          contentType: 'audio/webm'
        });
      } else {
        console.log('--- [api/transcribe_only] NO AUDIO FILE TO SEND');
      }
      try {
        // Send the audio file path to the Python API (like the current /transcribe endpoint)
        const audioFilePath = audioFile?.filepath;
        if (!audioFilePath) {
          return res.status(400).json({ error: 'No audio file provided' });
        }
        
        // Handle language field which might be an array
        const languageField = fields.language;
        const language = Array.isArray(languageField) ? languageField[0] : languageField || 'en';
        
        const requestData = {
          audio_file: audioFilePath,
          language: language
        };
        
        console.log('--- [api/transcribe_only] SENDING TO PYTHON:', requestData);
        
        const response = await axios.post(BACKEND_URL, requestData, {
          headers: {
            'Content-Type': 'application/json',
            Authorization: authHeader,
          },
          maxBodyLength: Infinity,
          timeout: 120000, // 2 minutes
        });
        
        console.log('--- [api/transcribe_only] PYTHON RESPONSE STATUS:', response.status);
        console.log('--- [api/transcribe_only] PYTHON RESPONSE DATA:', response.data);
        console.log('--- [api/transcribe_only] PYTHON RESPONSE HEADERS:', response.headers);
        
        res.status(response.status).json(response.data);
      } catch (axiosError: any) {
        console.error('--- [api/transcribe_only] AXIOS POST ERROR:', axiosError.message, axiosError.response?.data);
        if (axiosError.response) {
          res.status(axiosError.response.status).json(axiosError.response.data);
        } else {
          res.status(500).json({ error: 'Proxy error', details: axiosError.message });
        }
      }
    } catch (error: any) {
      console.error('--- [api/transcribe_only] UNEXPECTED ERROR:', error);
      res.status(500).json({ error: 'Proxy error', details: error.message });
    }
  });
} 