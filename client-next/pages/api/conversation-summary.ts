import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

const BACKEND_URL = 'http://localhost:5000/conversation_summary';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {
    const { chat_history, subgoal_instructions, target_language, feedback_language, is_continued_conversation } = req.body;

    console.log('[DEBUG] API: Sending request to backend:', {
      chat_history_length: chat_history?.length,
      subgoal_instructions,
      target_language: target_language || 'en',
      feedback_language: feedback_language || 'en',
      is_continued_conversation: is_continued_conversation || false
    });

    const response = await axios.post(BACKEND_URL, {
      chat_history,
      subgoal_instructions,
      target_language: target_language || 'en',
      feedback_language: feedback_language || 'en',
      is_continued_conversation: is_continued_conversation || false
    });

    console.log('[DEBUG] API: Received response from backend:', {
      status: response.status,
      data: response.data,
      progress_percentages: response.data?.progress_percentages,
      title: response.data?.title
    });

    res.status(response.status).json(response.data);
  } catch (error: any) {
    console.error('Conversation summary error:', error);
    if (error.response) {
      res.status(error.response.status).json(error.response.data);
    } else {
      res.status(500).json({ error: 'Failed to generate conversation summary' });
    }
  }
} 