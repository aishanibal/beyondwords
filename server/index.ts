require('dotenv').config();
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import multer from 'multer';
import type { StorageEngine, FileFilterCallback } from 'multer';
import type { Express } from 'express';
import type { Request as ExpressRequest } from 'express';
import {
  createUser,
  findUserByGoogleId,
  findUserByEmail,
  findUserById,
  updateUser,
  saveSession,
  getSession,
  getAllSessions,
  closeDatabase,
  getAllUsers,
  getConversationWithMessages,
  createConversation,
  getUserConversations,
  addMessage,
  updateConversationTitle,
  deleteConversation,
  createLanguageDashboard,
  getUserLanguageDashboards,
  getLanguageDashboard,
  updateLanguageDashboard,
  deleteLanguageDashboard,
  getUserStreak,
  User,
  LanguageDashboard,
  Session,
  Conversation,
  Message
} from './database';
import { OAuth2Client } from 'google-auth-library';
import path from 'path';
import fs from 'fs'; // Use fs, not fs/promises
import { exec } from 'child_process';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import axios from 'axios';
const JWT_SECRET = process.env.JWT_SECRET || 'your_super_secret_key';
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Extend Express Request to include 'user'
declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

// Fix: Type for global variables
type GlobalWithSpeechVars = typeof globalThis & {
  lastChatHistory?: any;
  lastAudioFile?: string;
  lastTranscription?: string;
};
const globalAny = global as GlobalWithSpeechVars;

const app = express();

// Log every incoming request for debugging
app.use((req, res, next) => {
  console.log('INCOMING REQUEST:', req.method, req.url, 'Headers:', req.headers);
  next();
});

app.use(express.json());
app.use(cors({ origin: 'http://localhost:3000', credentials: false }));

// Multer configuration for file uploads
const storage: StorageEngine = multer.diskStorage({
  destination: function (req: ExpressRequest, file: Express.Multer.File, cb: (error: Error | null, destination: string) => void) {
    cb(null, uploadsDir); // Use absolute path
  },
  filename: function (req: ExpressRequest, file: Express.Multer.File, cb: (error: Error | null, filename: string) => void) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + '.wav');
  }
});

// Ensure uploads directory exists using absolute path
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const upload = multer({ 
  storage: storage,
  fileFilter: (req: ExpressRequest, file: Express.Multer.File, cb: FileFilterCallback) => {
    if (file.mimetype === 'audio/wav' || file.mimetype === 'audio/webm') {
      cb(null, true);
    } else {
      cb(null, false);
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// MongoDB connection (commented out for now)
// mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/beyondwords_speech', {
//   useNewUrlParser: true,
//   useUnifiedTopology: true,
// });

// User schema (commented out for now)
// const userSchema = new mongoose.Schema({
//   googleId: String,
//   email: String,
//   name: String,
//   role: { type: String, default: 'user' },
//   createdAt: { type: Date, default: Date.now }
// });
// const User = mongoose.model('User', userSchema);

// Analysis Session Schema (commented out for now)
// const analysisSessionSchema = new mongoose.Schema({
//   userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
//   audioFile: String,
//   transcription: String,
//   aiResponse: String,
//   detailedFeedback: String,
//   createdAt: { type: Date, default: Date.now }
// });
// const AnalysisSession = mongoose.model('AnalysisSession', analysisSessionSchema);

// Session (commented out for now)
// app.use(session({
//   secret: process.env.SESSION_SECRET,
//   resave: false,
//   saveUninitialized: false
// }));

// Passport config (commented out for now)
// app.use(passport.initialize());
// app.use(passport.session());
// passport.serializeUser((user, done) => done(null, user.id));
// passport.deserializeUser((id, done) => User.findById(id, done));

// passport.use(new GoogleStrategy({
//   clientID: process.env.GOOGLE_CLIENT_ID,
//   clientSecret: process.env.GOOGLE_CLIENT_SECRET,
//   callbackURL: '/auth/google/callback'
// }, async (accessToken, refreshToken, profile, done) => {
//   let user = await User.findOne({ googleId: profile.id });
//   if (!user) {
//     user = await User.create({
//       googleId: profile.id,
//       email: profile.emails[0].value,
//       name: profile.displayName
//     });
//   }
//   return done(null, user);
// }));

// Google OAuth client (commented out for now)
// const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Authentication middleware (commented out for now)
// const authenticateUser = async (req, res, next) => {
//   try {
//     const token = req.headers.authorization?.split(' ')[1];
//     if (!token) {
//       return res.status(401).json({ error: 'No token provided' });
//     }

//     const ticket = await googleClient.verifyIdToken({
//       idToken: token,
//       audience: process.env.GOOGLE_CLIENT_ID
//     });

//     const payload = ticket.getPayload();
//     let user = await User.findOne({ googleId: payload.sub });
    
//     if (!user) {
//       user = new User({
//         googleId: payload.sub,
//         email: payload.email,
//         name: payload.name
//       });
//       await user.save();
//     }

//     req.user = user;
//     next();
//   } catch (error) {
//     console.error('Auth error:', error);
//     res.status(401).json({ error: 'Invalid token' });
//   }
// };

// JWT middleware
function authenticateJWT(req: ExpressRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'No token provided' });
  const token = authHeader.split(' ')[1];
  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) return res.status(403).json({ error: 'Invalid token' });
    req.user = user;
    next();
  });
}

// Routes
app.get('/api/user', authenticateJWT, async (req: Request, res: Response) => {
  try {
    let user = await findUserById(req.user.userId);

    if (!user) {
      // Create a new user record if not found
      user = await createUser({
        // id is auto-incremented, so don't set it
        email: req.user.email || '',
        name: req.user.name || '',
        role: 'user',
        onboarding_complete: false
      });
    }

    // Parse arrays from JSON strings
    if (user && typeof user.talk_topics === 'string') {
      try { user.talk_topics = JSON.parse(user.talk_topics); } catch (e) { user.talk_topics = []; }
    }
    if (user && user.learning_goals) {
      try {
        user.learning_goals = typeof user.learning_goals === 'string'
          ? JSON.parse(user.learning_goals)
          : user.learning_goals;
      } catch (e) { user.learning_goals = []; }
    }

    res.json({ user });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/api/logout', (req: Request, res: Response) => {
  res.json({ message: 'Logged out' });
});

// Add streak endpoint
app.get('/api/user/streak', async (req: Request, res: Response) => {
  console.log('[STREAK DEBUG] /api/user/streak called', { userId: req.user?.id || req.query.userId, language: req.query.language });
  let userId = req.user?.id;
  if (!userId && req.query.userId) {
    userId = Array.isArray(req.query.userId) ? req.query.userId[0] : req.query.userId;
  }
  let language = req.query.language;
  if (Array.isArray(language)) language = language[0];
  if (typeof userId !== 'string' || typeof language !== 'string') {
    return res.status(400).json({ error: 'Missing user or language' });
  }

  try {
    const result = await getUserStreak(Number(userId), language);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Audio analysis endpoint
app.post('/api/analyze', authenticateJWT, upload.single('audio'), async (req: Request, res: Response) => {
  try {
    console.log('POST /api/analyze called');
    console.log('req.file:', req.file);
    if (!req.file) {
      console.error('No audio file provided');
      return res.status(400).json({ error: 'No audio file provided' });
    }

    // Use the path from multer
    const audioFilePath = req.file.path;
    console.log('Audio file saved at:', audioFilePath);

    // Accept chatHistory from request body (for context-aware fast response)
    let chatHistory: any[] = [];
    if (req.body.chatHistory) {
      try {
        chatHistory = JSON.parse(req.body.chatHistory);
      } catch (e) {
        console.error('Error parsing chatHistory:', e);
        chatHistory = [];
      }
    }
    globalAny.lastChatHistory = chatHistory; // Optionally store for session continuity

    // Get user preferences from form data (preferred) or fall back to database
    const user = await findUserById(req.user.userId);
    const userLevel = req.body.user_level || user?.proficiency_level || 'beginner';
    const userTopics = req.body.user_topics ? JSON.parse(req.body.user_topics) : (user?.talk_topics && typeof user.talk_topics === 'string' ? JSON.parse(user.talk_topics) : Array.isArray(user?.talk_topics) ? user.talk_topics : []);
    const userGoals = req.body.user_goals ? JSON.parse(req.body.user_goals) : (user?.learning_goals && typeof user.learning_goals === 'string' ? JSON.parse(user.learning_goals) : Array.isArray(user?.learning_goals) ? user.learning_goals : []);
    const formality = req.body.formality || 'friendly';
    const feedbackLanguage = req.body.feedback_language || 'en';
    
    console.log('🔄 SERVER: /api/analyze received formality:', formality);
    console.log('🔄 SERVER: /api/analyze received user_goals:', userGoals);
    console.log('🔄 SERVER: /api/analyze form data:', req.body);

    // Call Python API for transcription and AI response (using ollama_client)
    const pythonApiUrl = process.env.PYTHON_API_URL || 'http://localhost:5000';
    
    console.log('Calling Python API for transcription and AI response:', `${pythonApiUrl}/transcribe`);
    let transcription = 'Speech recorded';
    let aiResponse = 'Thank you for your speech!';
    let pythonApiAvailable = false;
    
    try {
      console.log('=== ATTEMPTING PYTHON API CALL ===');
      console.log('Python API URL:', `${pythonApiUrl}/transcribe`);
      console.log('Audio file path:', audioFilePath);
      console.log('Chat history length:', chatHistory.length);
      console.log('Language:', req.body.language || 'en');
      
      // Check if audio file exists before sending to Python API
      if (!fs.existsSync(audioFilePath)) {
        throw new Error(`Audio file does not exist: ${audioFilePath}`);
      }
      const fileStats = fs.statSync(audioFilePath);
      console.log('Audio file size:', fileStats.size, 'bytes');
      
      const transcriptionResponse = await axios.post(`${pythonApiUrl}/transcribe`, {
        audio_file: audioFilePath, // Use multer's saved file path
        chat_history: chatHistory,
        language: req.body.language || 'en',
        user_level: userLevel,
        user_topics: userTopics,
        user_goals: userGoals,
        formality: formality,
        feedback_language: feedbackLanguage
      }, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 30000
      });
      
      console.log('=== PYTHON API SUCCESS ===');
      console.log('Python API response received:', transcriptionResponse.data);
      transcription = transcriptionResponse.data.transcription || 'Speech recorded';
      aiResponse = transcriptionResponse.data.ai_response || 'Thank you for your speech!';
      pythonApiAvailable = true;
      console.log('Using transcription from Python API:', transcription);
      console.log('Using AI response from Python API:', aiResponse);
    } catch (transcriptionError: any) {
      console.error('=== PYTHON API FAILED ===');
      console.error('Python API call failed:', transcriptionError.message);
      console.error('Error details:', transcriptionError.response?.data || transcriptionError.code || 'No additional details');
      console.log('Falling back to basic transcription and response');
      pythonApiAvailable = false;
      // Keep the default values
    }

    // Generate text-to-speech for the response using macOS 'say'
    let ttsUrl = null;
    const language = req.body.language || 'en';
    try {
      const ttsFileName = `tts_${Date.now()}.wav`;
      const ttsFilePath = path.join(uploadsDir, ttsFileName);
      
      // Choose voice based on language with fallback
      let ttsVoice = 'Karen'; // Default to English (Alex is more reliable than Flo)
      if (language === 'es') ttsVoice = 'Mónica'; // Spanish voice
      else if (language === 'hi') ttsVoice = 'Lekha'; // macOS Hindi voice
      else if (language === 'ja') ttsVoice = 'Otoya'; // macOS Japanese voice
      
      // Check if voice is available
      try {
        await new Promise<void>((resolve, reject) => {
          exec(`say -v ${ttsVoice} "test"`, (error) => {
            if (error) reject(error);
            else resolve();
          });
        });
      } catch (voiceError) {
        console.log(`Voice ${ttsVoice} not available, using default`);
        ttsVoice = 'Alex'; // Fallback to Alex
      }
      
      const sayCmd = `say -v ${ttsVoice} -o "${ttsFilePath}" --data-format=LEI16@22050 "${aiResponse.replace(/\"/g, '\\"')}"`;
      console.log('TTS voice:', ttsVoice);
      console.log('TTS command:', sayCmd);
      console.log('TTS text length:', aiResponse.length);
      
      await new Promise<void>((resolve, reject) => {
        exec(sayCmd, (error) => {
          if (error) {
            console.error('TTS command failed:', error);
            reject(error);
          } else {
            console.log('TTS command completed successfully');
            resolve();
          }
        });
      });
      
      // Check if file was created
      if (fs.existsSync(ttsFilePath)) {
        const stats = fs.statSync(ttsFilePath);
        console.log('TTS file created, size:', stats.size, 'bytes');
        ttsUrl = `/uploads/${ttsFileName}`;
        console.log('TTS audio generated at:', ttsUrl);
      } else {
        console.error('TTS file was not created');
        ttsUrl = null;
      }
    } catch (ttsError) {
      console.error('TTS error:', ttsError);
      ttsUrl = null;
    }

    // Store the audio file path and chat history globally for detailed feedback later
    globalAny.lastAudioFile = audioFilePath;
    globalAny.lastTranscription = transcription;
    globalAny.lastChatHistory = chatHistory;

    console.log('Sending successful response to frontend');
    res.json({
      transcription: transcription,
      aiResponse: aiResponse,
      ttsUrl: ttsUrl,
      sessionId: null
    });

  } catch (error: any) {
    console.error('Analysis error:', error);
    console.error('Error stack:', error.stack);
    if (error.response) {
      console.error('Error response:', error.response.data);
    }
    // Return error response instead of fallback
    res.status(500).json({
      error: 'Error processing audio',
      details: error.message,
      transcription: 'Speech recorded',
      aiResponse: 'Thank you for your speech! Keep practicing.',
      ttsUrl: null,
      sessionId: 'error-session'
    });
  }
});

// Detailed feedback endpoint
app.post('/api/feedback', authenticateJWT, async (req: Request, res: Response) => {
  try {
    console.log('POST /api/feedback called');
    console.log('Request body:', req.body);
    const { user_input, context, language, user_level, user_topics } = req.body;
    
    if (!user_input || !context) {
      console.log('Missing required fields:', { user_input: !!user_input, context: !!context });
      return res.status(400).json({ error: 'Missing user_input or context' });
    }
    
    console.log('Parsed parameters:', { user_input, context: context.substring(0, 100) + '...', language, user_level, user_topics });
    
    // Parse context string into chat_history array
    const chat_history = context
      .split('\n')
      .map((line: string) => {
        const [sender, ...rest] = line.split(':');
        return { sender: sender.trim(), text: rest.join(':').trim() };
      });

    console.log('Parsed chat_history:', chat_history);

    // Call Python API for detailed feedback
    let feedback = '';
    try {
      const pythonApiUrl = process.env.PYTHON_API_URL || 'http://localhost:5000';
      const pythonResponse = await axios.post(`${pythonApiUrl}/feedback`, {
        chat_history,
        last_transcription: user_input,
        language,
        user_level,
        user_topics,
        feedback_language: 'en' // Default to English for now
      }, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 120000
      });
      feedback = pythonResponse.data.feedback;
      console.log('Python feedback received.');
    } catch (pythonError: any) {
      console.error('Python API not available for feedback:', pythonError.message);
      feedback = 'Error: Could not get detailed feedback from Python API.';
    }
    res.json({ feedback });
  } catch (error: any) {
    console.error('Feedback error:', error);
    res.status(500).json({ error: 'Error getting feedback', details: error.message });
  }
});

// Store detailed feedback for a specific message
app.post('/api/messages/:messageId/feedback', authenticateJWT, async (req: Request, res: Response) => {
  try {
    const { messageId } = req.params;
    const { feedback } = req.body;
    
    if (!feedback) {
      return res.status(400).json({ error: 'No feedback provided' });
    }
    
    console.log('Storing detailed feedback for message:', messageId);
    
    // Update the message with detailed feedback
    const updateSql = `
      UPDATE messages 
      SET detailed_feedback = ? 
      WHERE id = ?
    `;
    
    await new Promise<{ changes: number }>((resolve, reject) => {
      const { db } = require('./database');
      db.run(updateSql, [feedback, messageId], function(this: any, err: any) {
        if (err) {
          reject(err);
        } else {
          resolve({ changes: this.changes });
        }
      });
    });
    
    res.json({ success: true, message: 'Feedback stored successfully' });
  } catch (error: any) {
    console.error('Store feedback error:', error);
    res.status(500).json({ error: 'Error storing feedback', details: error.message });
  }
});

// Save session endpoint
app.post('/api/save-session', async (req: Request, res: Response) => {
  try {
    const { userId, chatHistory, language = 'en' } = req.body;
    if (!userId) {
      return res.status(401).json({ error: 'User ID required' });
    }
    if (!chatHistory || !Array.isArray(chatHistory) || chatHistory.length === 0) {
      return res.status(400).json({ error: 'No chat history provided' });
    }
    
    // Save the session
    const session = await saveSession(Number(userId), chatHistory, language);
    res.json({ success: true, sessionId: session.id });
  } catch (error: any) {
    console.error('Save session error:', error);
    res.status(500).json({ error: 'Failed to save session', details: error.message });
  }
});

// Get user sessions
app.get('/api/sessions/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const sessions = await getAllSessions(Number(userId));
    res.json({ sessions });
  } catch (error: any) {
    console.error('Get sessions error:', error);
    res.status(500).json({ error: 'Failed to get sessions' });
  }
});

// Get latest session
app.get('/api/sessions/:userId/latest', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const session = await getSession(Number(userId));
    res.json({ session });
  } catch (error: any) {
    console.error('Get latest session error:', error);
    res.status(500).json({ error: 'Failed to get latest session' });
  }
});

// Google OAuth token verification
app.post('/auth/google/token', async (req: Request, res: Response) => {
  try {
    const { credential } = req.body;
    
    // Verify the Google token
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID
    });
    
    const payload = ticket.getPayload();
    const { sub: googleId, email, name } = payload || { sub: '', email: '', name: '' };
    
    let user = await findUserByGoogleId(googleId);
    
    if (!user) {
      user = await createUser({
        googleId,
        email,
        name,
        role: 'user',
        onboarding_complete: false
      });
    }
    
    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email, name: user.name },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Ensure user object includes onboarding status
    const userResponse = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      onboarding_complete: Boolean(user.onboarding_complete),
      target_language: user.target_language,
      proficiency_level: user.proficiency_level
    };

    res.json({ user: userResponse, token });
  } catch (error: any) {
    console.error('Google auth error:', error);
    res.status(400).json({ error: 'Invalid credential' });
  }
});

// Email/password registration
app.post('/auth/register', async (req: Request, res: Response) => {
  try {
    const { name, email, password } = req.body;
    
    // Check if user already exists
    const existingUser = await findUserByEmail(email);
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }
    
    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);
    
    // Create user
    const user = await createUser({
      email,
      name,
      password_hash: passwordHash,
      role: 'user'
    });
    
    // Generate JWT token for immediate login
    const token = jwt.sign(
      { userId: user.id, email: user.email, name: user.name },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    res.json({ 
      token,
      user: { 
        id: user.id, 
        name: user.name, 
        email: user.email, 
        role: user.role,
        onboarding_complete: Boolean(user.onboarding_complete)
      } 
    });
  } catch (error: any) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Email/password login with JWT
app.post('/auth/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const user = await findUserByEmail(email);
    
    // Check if user exists
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });
    
    // Check if user has a password (not a Google-only account)
    if (!user.password_hash) {
      return res.status(401).json({ error: 'This email is associated with a Google account. Please sign in with Google.' });
    }
    
    // Verify password
    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) return res.status(401).json({ error: 'Invalid credentials' });
    
    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email, name: user.name },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    // Return user data including onboarding status
    res.json({ 
      token, 
      user: { 
        id: user.id, 
        email: user.email, 
        name: user.name,
        role: user.role,
        onboarding_complete: Boolean(user.onboarding_complete)
      } 
    });
  } catch (error: any) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Onboarding route (protected) - Creates first language dashboard
app.post('/api/user/onboarding', authenticateJWT, async (req: Request, res: Response) => {
  try {
    console.log('Onboarding request received:', req.body);
    const { language, proficiency, talkTopics, learningGoals, practicePreference } = req.body;
    
    console.log('Extracted fields:', { language, proficiency, talkTopics, learningGoals, practicePreference });
    
    if (!language || !proficiency || !talkTopics || !learningGoals || !practicePreference) {
      console.log('Missing required fields validation failed');
      return res.status(400).json({ error: 'Missing required onboarding fields' });
    }
    
    // Create the first language dashboard (primary)
    const dashboard = await createLanguageDashboard(
      req.user.userId,
      language,
      proficiency,
      talkTopics,
      learningGoals,
      practicePreference,
      'en', // feedbackLanguage
      true // isPrimary as boolean
    );
    
    // Update user to mark onboarding as complete
    await updateUser(req.user.userId, {
      onboarding_complete: true
    });
    
    const user = await findUserById(req.user.userId);
    
    res.json({ 
      user: {
        ...user,
        onboarding_complete: Boolean(user?.onboarding_complete)
      },
      dashboard 
    });
  } catch (error: any) {
    console.error('Onboarding error:', error);
    res.status(500).json({ error: 'Failed to save onboarding' });
  }
});

// Profile update route (protected)
app.put('/api/user/profile', authenticateJWT, async (req: Request, res: Response) => {
  try {
    console.log('Profile update request received:', req.body);
    console.log('User ID from JWT:', req.user.userId);
    
    const { name, email } = req.body;
    
    // Validate required fields
    if (!name || !email) {
      console.log('Validation failed: missing name or email');
      return res.status(400).json({ error: 'Name and email are required' });
    }
    
    console.log('Updating user with data:', { name, email });
    
    // Update user profile (only personal info)
    await updateUser(req.user.userId, {
      name,
      email
    });
    
    console.log('User updated successfully');
    
    // Get updated user data
    const user = await findUserById(req.user.userId);
    
    console.log('Retrieved updated user:', user);
    
    if (user && user.learning_goals) {
      try {
        user.learning_goals = typeof user.learning_goals === 'string'
          ? JSON.parse(user.learning_goals)
          : user.learning_goals;
      } catch (e) {
        user.learning_goals = [];
      }
    }
    
    console.log('Sending response with user:', user);
    res.json({ user });
  } catch (error: any) {
    console.error('Profile update error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// Language Dashboard APIs

// Get all language dashboards for a user
app.get('/api/user/language-dashboards', authenticateJWT, async (req: Request, res: Response) => {
  try {
    const dashboards = await getUserLanguageDashboards(req.user.userId);
    res.json({ dashboards });
  } catch (error: any) {
    console.error('Get language dashboards error:', error);
    res.status(500).json({ error: 'Failed to get language dashboards' });
  }
});

// Get a specific language dashboard
app.get('/api/user/language-dashboards/:language', authenticateJWT, async (req: Request, res: Response) => {
  try {
    const { language } = req.params;
    const dashboard = await getLanguageDashboard(req.user.userId, language);
    
    if (!dashboard) {
      return res.status(404).json({ error: 'Language dashboard not found' });
    }
    
    res.json({ dashboard });
  } catch (error: any) {
    console.error('Get language dashboard error:', error);
    res.status(500).json({ error: 'Failed to get language dashboard' });
  }
});

// Create a new language dashboard
app.post('/api/user/language-dashboards', authenticateJWT, async (req: Request, res: Response) => {
  try {
    const { language, proficiency, talkTopics, learningGoals, practicePreference } = req.body;
    
    if (!language || !proficiency || !talkTopics || !learningGoals || !practicePreference) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Check if user already has a dashboard for this language
    const existingDashboard = await getLanguageDashboard(req.user.userId, language);
    if (existingDashboard) {
      return res.status(409).json({ error: 'Language dashboard already exists' });
    }
    
    // Check if this is the user's first dashboard (make it primary)
    const existingDashboards = await getUserLanguageDashboards(req.user.userId);
    const isPrimary = existingDashboards.length === 0;
    
    const dashboard = await createLanguageDashboard(
      req.user.userId,
      language,
      proficiency,
      talkTopics,
      learningGoals,
      practicePreference,
      'en', // feedbackLanguage
      isPrimary // isPrimary as boolean
    );
    
    res.json({ dashboard });
  } catch (error: any) {
    console.error('Create language dashboard error:', error);
    res.status(500).json({ error: 'Failed to create language dashboard' });
  }
});

// Update a language dashboard
app.put('/api/user/language-dashboards/:language', authenticateJWT, async (req: Request, res: Response) => {
  try {
    const { language } = req.params;
    const updates = req.body;
    
    // Check if dashboard exists
    const existingDashboard = await getLanguageDashboard(req.user.userId, language);
    if (!existingDashboard) {
      return res.status(404).json({ error: 'Language dashboard not found' });
    }
    
    await updateLanguageDashboard(req.user.userId, language, updates);
    
    // Get updated dashboard
    const dashboard = await getLanguageDashboard(req.user.userId, language);
    
    res.json({ dashboard });
  } catch (error: any) {
    console.error('Update language dashboard error:', error);
    res.status(500).json({ error: 'Failed to update language dashboard' });
  }
});

// Delete a language dashboard
app.delete('/api/user/language-dashboards/:language', authenticateJWT, async (req: Request, res: Response) => {
  try {
    const { language } = req.params;
    
    // Check if dashboard exists
    const existingDashboard = await getLanguageDashboard(req.user.userId, language);
    if (!existingDashboard) {
      return res.status(404).json({ error: 'Language dashboard not found' });
    }
    
    // Don't allow deletion of primary dashboard if it's the only one
    const allDashboards = await getUserLanguageDashboards(req.user.userId);
    if (existingDashboard.is_primary && allDashboards.length === 1) {
      return res.status(400).json({ error: 'Cannot delete the only language dashboard' });
    }
    
    await deleteLanguageDashboard(req.user.userId, language);
    
    res.json({ message: 'Language dashboard deleted successfully' });
  } catch (error: any) {
    console.error('Delete language dashboard error:', error);
    res.status(500).json({ error: 'Failed to delete language dashboard' });
  }
});

// Health check endpoint
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    pythonApiUrl: process.env.PYTHON_API_URL || 'http://localhost:5000'
  });
});

// Test TTS endpoint
app.get('/api/test-tts', async (req: Request, res: Response) => {
  try {
    const testText = "Hello, this is a test of text to speech.";
    const ttsFileName = `test_tts_${Date.now()}.aiff`;
    const ttsFilePath = path.join(uploadsDir, ttsFileName);
    
    const sayCmd = `say -v Alex -o "${ttsFilePath}" "${testText}"`;
    console.log('Test TTS command:', sayCmd);
    
    await new Promise<void>((resolve, reject) => {
      exec(sayCmd, (error) => {
        if (error) {
          console.error('Test TTS command failed:', error);
          reject(error);
        } else {
          console.log('Test TTS command completed successfully');
          resolve();
        }
      });
    });
    
    if (fs.existsSync(ttsFilePath)) {
      const stats = fs.statSync(ttsFilePath);
      console.log('Test TTS file created, size:', stats.size, 'bytes');
      res.json({ 
        success: true, 
        ttsUrl: `/uploads/${ttsFileName}`,
        fileSize: stats.size
      });
    } else {
      res.status(500).json({ error: 'Test TTS file was not created' });
    }
  } catch (error: any) {
    console.error('Test TTS error:', error);
    res.status(500).json({ error: 'Test TTS failed', details: error.message });
  }
});

// Admin: List all users
app.get('/api/admin/users', authenticateJWT, async (req: Request, res: Response) => {
  try {
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    const users = await getAllUsers();
    res.json({ users });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Admin: Promote user to admin
app.post('/api/admin/promote', authenticateJWT, async (req: Request, res: Response) => {
  try {
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email required' });
    const user = await findUserByEmail(email);
    if (!user) return res.status(404).json({ error: 'User not found' });
    await updateUser(user.id, { role: 'admin' });
    res.json({ success: true, message: `${email} promoted to admin.` });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to promote user' });
  }
});

// Admin: Demote user to regular user
app.post('/api/admin/demote', authenticateJWT, async (req: Request, res: Response) => {
  try {
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email required' });
    const user = await findUserByEmail(email);
    if (!user) return res.status(404).json({ error: 'User not found' });
    await updateUser(user.id, { role: 'user' });
    res.json({ success: true, message: `${email} demoted to user.` });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to demote user' });
  }
});

// Conversation endpoints
app.post('/api/conversations', authenticateJWT, async (req: Request, res: Response) => {
  try {
    const { language, title, topics, formality } = req.body;
    console.log('🔄 SERVER: Creating conversation with formality:', formality);
    console.log('🔄 SERVER: Full request body:', req.body);
    const conversation = await createConversation(req.user.userId, language, title, topics, formality);
    console.log('🔄 SERVER: Conversation creation result:', conversation);
    if (!conversation || !conversation.id) {
      console.error('❌ SERVER: Failed to create conversation');
      return res.status(500).json({ error: 'Failed to create conversation' });
    }
    // Immediately try to fetch the conversation from the DB
    const verify = await getConversationWithMessages(conversation.id);
    if (!verify) {
      console.error('❌ SERVER: Conversation not found after creation:', conversation.id);
      return res.status(500).json({ error: 'Conversation not found after creation' });
    }
    // Generate and save AI intro message
    let aiMessage = null;
    let aiIntro = 'Hello! What would you like to talk about today?';
    try {
      const user = await findUserById(req.user.userId);
      const userLevel = user?.proficiency_level || 'beginner';
      const userTopics = user?.talk_topics && typeof user.talk_topics === 'string' ? JSON.parse(user.talk_topics) : Array.isArray(user?.talk_topics) ? user.talk_topics : [];
      const pythonApiUrl = process.env.PYTHON_API_URL || 'http://localhost:5000';
      const topicsToSend = topics && topics.length > 0 ? topics : userTopics;
      try {
        const aiRes = await axios.post(`${pythonApiUrl}/initial_message`, {
          chat_history: [],
          language,
          user_level: userLevel,
          user_topics: topicsToSend,
          formality: formality || 'friendly'
        }, {
          headers: { 'Content-Type': 'application/json' },
          timeout: 30000
        });
        console.log('DEBUG: Sending formality to /initial_message:', formality || 'friendly');
        console.log('DEBUG: Received ai_response from Python API:', aiRes.data.ai_response);
        aiIntro = aiRes.data.ai_response && aiRes.data.ai_response.trim() ? aiRes.data.ai_response : 'Hello! What would you like to talk about today?';
      } catch (err: any) {
        console.error('Python API /initial_message error:', err.message);
        aiIntro = 'Hello! What would you like to talk about today?';
      }
      aiMessage = await addMessage(conversation.id, 'AI', aiIntro, 'text', undefined, undefined);
    } catch (err) {
      console.error('Error generating/saving AI intro message:', err);
    }
    // Return the actual AI intro text for the frontend
    res.json({ conversation, aiMessage: { text: aiIntro } });
  } catch (error: any) {
    console.error('❌ SERVER: Create conversation error:', error);
    res.status(500).json({ error: 'Failed to create conversation' });
  }
});

app.get('/api/conversations', authenticateJWT, async (req: Request, res: Response) => {
  try {
    const language = req.query.language;
    console.log('🔄 SERVER: Getting conversations for user:', req.user.userId, 'language:', language);
    console.log('🔍 SERVER: Query params:', req.query);
    const conversations = await getUserConversations(req.user.userId, typeof language === 'string' ? language : undefined);
    console.log('✅ SERVER: Found conversations:', conversations.length);
    console.log('📋 SERVER: Conversation details:', conversations.map(c => ({
      id: c.id,
      title: c.title,
      language: 'language' in c ? (c as any).language : undefined
    })));
    res.json({ conversations });
  } catch (error: any) {
    console.error('❌ SERVER: Get conversations error:', error);
    res.status(500).json({ error: 'Failed to get conversations' });
  }
});

app.get('/api/conversations/:id', authenticateJWT, async (req: Request, res: Response) => {
  try {
    console.log('🔄 SERVER: Getting conversation:', req.params.id);
    const conversation = await getConversationWithMessages(Number(req.params.id));
    if (!conversation) {
      console.log('❌ SERVER: Conversation not found:', req.params.id);
      return res.status(404).json({ error: 'Conversation not found' });
    }
    console.log('✅ SERVER: Conversation loaded with', conversation.messages?.length || 0, 'messages');
    console.log('📝 SERVER: Conversation details:', {
      id: conversation.id,
      title: conversation.title,
      language: (conversation as any).language,
      formality: (conversation as any).formality,
      messageCount: conversation.message_count,
      messagesLength: conversation.messages?.length || 0
    });
    if (conversation.messages && conversation.messages.length > 0) {
      console.log('📋 SERVER: Sample messages:', conversation.messages.slice(0, 2));
    }
    res.json({ conversation });
  } catch (error: any) {
    console.error('❌ SERVER: Get conversation error:', error);
    res.status(500).json({ error: 'Failed to get conversation' });
  }
});

app.post('/api/conversations/:id/messages', authenticateJWT, async (req: Request, res: Response) => {
  try {
    console.log('🔄 SERVER: Adding message to conversation:', req.params.id);
    const { sender, text, messageType, audioFilePath, detailedFeedback, message_order } = req.body;
    console.log('📝 SERVER: Message details:', { sender, text: text.substring(0, 50) + '...', messageType, message_order });

    const message = await addMessage(
      Number(req.params.id),
      sender,
      text,
      messageType,
      audioFilePath,
      detailedFeedback,
      message_order // <-- pass it here
    );

    res.json({ message });
  } catch (error: any) {
    console.error('❌ SERVER: Add message error:', error);
    res.status(500).json({ error: 'Failed to add message' });
  }
});

app.put('/api/conversations/:id/title', authenticateJWT, async (req: Request, res: Response) => {
  try {
    const { title } = req.body;
    const result = await updateConversationTitle(Number(req.params.id), title);
    res.json({ success: true, changes: result.changes });
  } catch (error: any) {
    console.error('Update conversation title error:', error);
    res.status(500).json({ error: 'Failed to update conversation title' });
  }
});

app.delete('/api/conversations/:id', authenticateJWT, async (req: Request, res: Response) => {
  try {
    const result = await deleteConversation(Number(req.params.id));
    res.json({ success: true, changes: result.changes });
  } catch (error: any) {
    console.error('Delete conversation error:', error);
    res.status(500).json({ error: 'Failed to delete conversation' });
  }
});

// Text suggestions endpoint
app.post('/api/suggestions', authenticateJWT, async (req: Request, res: Response) => {
  try {
    console.log('POST /api/suggestions called');
    const { conversationId, language } = req.body;
    
    // Get user data for personalized suggestions
    const user = await findUserById(req.user.userId);
    const userLevel = req.body.user_level || user?.proficiency_level || 'beginner';
    const userTopics = req.body.user_topics || (user?.talk_topics && typeof user.talk_topics === 'string' ? JSON.parse(user.talk_topics) : Array.isArray(user?.talk_topics) ? user.talk_topics : []);
    const userGoals = req.body.user_goals || (user?.learning_goals && typeof user.learning_goals === 'string' ? JSON.parse(user.learning_goals) : Array.isArray(user?.learning_goals) ? user.learning_goals : []);
    
    let chatHistory: any[] = [];
    if (conversationId) {
      // Get conversation history
      const conversation = await getConversationWithMessages(Number(conversationId));
      if (conversation) {
        chatHistory = (conversation.messages || []).map(msg => ({
          sender: msg.sender,
          text: msg.text,
          timestamp: msg.created_at
        }));
      }
    }
    
    // Call Python API for suggestions
    try {
      const pythonApiUrl = process.env.PYTHON_API_URL || 'http://localhost:5000';
      const pythonResponse = await axios.post(`${pythonApiUrl}/suggestions`, {
        chat_history: chatHistory,
        language: language || user?.target_language || 'en',
        user_level: userLevel,
        user_topics: userTopics,
        user_goals: userGoals
      }, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 30000
      });
      
      console.log('Python suggestions received:', pythonResponse.data.suggestions.length);
      res.json({ suggestions: pythonResponse.data.suggestions });
    } catch (pythonError: any) {
      console.error('Python API not available for suggestions:', pythonError.message);
      
      // Fallback suggestions if Python API fails
      const fallbackSuggestions = [
        { text: "Hello", translation: "Hello", difficulty: "easy" },
        { text: "How are you?", translation: "How are you?", difficulty: "easy" },
        { text: "Thank you", translation: "Thank you", difficulty: "easy" }
      ];
      
      res.json({ suggestions: fallbackSuggestions });
    }
  } catch (error: any) {
    console.error('Suggestions error:', error);
    res.status(500).json({ error: 'Error getting suggestions', details: error.message });
  }
});

// Translation endpoint
app.post('/api/translate', authenticateJWT, async (req: Request, res: Response) => {
  try {
    console.log('POST /api/translate called');
    const { text, source_language, target_language, breakdown } = req.body;
    
    if (!text) {
      return res.status(400).json({ error: 'No text provided' });
    }
    
    // Default target language to English if not specified
    const finalTargetLanguage = target_language || 'en';
    
    // Call Python API for translation
    try {
      const pythonApiUrl = process.env.PYTHON_API_URL || 'http://localhost:5000';
      const pythonResponse = await axios.post(`${pythonApiUrl}/translate`, {
        text: text,
        source_language: source_language || 'auto',
        target_language: finalTargetLanguage,
        breakdown: breakdown || false
      }, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 30000
      });
      
      console.log('Python translation received');
      res.json(pythonResponse.data);
    } catch (pythonError: any) {
      console.error('Python API not available for translation:', pythonError.message);
      
      // Fallback response if Python API fails
      res.json({
        translation: "Translation service temporarily unavailable",
        source_language: source_language || 'auto',
        target_language: finalTargetLanguage,
        has_breakdown: false,
        error: "Python API not available"
      });
    }
  } catch (error: any) {
    console.error('Translation error:', error);
    res.status(500).json({ error: 'Error getting translation', details: error.message });
  }
});

// Proxy /api/short_feedback to Python API
app.post('/api/short_feedback', authenticateJWT, async (req: Request, res: Response) => {
  try {
    // Get user preferences from request body or fall back to database
    const user = await findUserById(req.user.userId);
    const userLevel = req.body.user_level || user?.proficiency_level || 'beginner';
    const userTopics = req.body.user_topics || (user?.talk_topics && typeof user.talk_topics === 'string' ? JSON.parse(user.talk_topics) : Array.isArray(user?.talk_topics) ? user.talk_topics : []);
    const userGoals = req.body.user_goals || (user?.learning_goals && typeof user.learning_goals === 'string' ? JSON.parse(user.learning_goals) : Array.isArray(user?.learning_goals) ? user.learning_goals : []);
    const feedbackLanguage = req.body.feedback_language || 'en';

    const pythonApiUrl = process.env.PYTHON_API_URL || 'http://localhost:5000';
    const response = await axios.post(`${pythonApiUrl}/short_feedback`, {
      ...req.body, // Pass all original request body
      user_level: userLevel,
      user_topics: userTopics,
      user_goals: userGoals
    }, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 30000
    });
    res.status(response.status).json(response.data);
  } catch (error: any) {
    res.status(error.response?.status || 500).json(error.response?.data || { error: error.message });
  }
});

// Proxy /api/detailed_breakdown to Python API
app.post('/api/detailed_breakdown', authenticateJWT, async (req: Request, res: Response) => {
  try {
    // Get user preferences from request body or fall back to database
    const user = await findUserById(req.user.userId);
    const userLevel = req.body.user_level || user?.proficiency_level || 'beginner';
    const userTopics = req.body.user_topics || (user?.talk_topics && typeof user.talk_topics === 'string' ? JSON.parse(user.talk_topics) : Array.isArray(user?.talk_topics) ? user.talk_topics : []);
    const userGoals = req.body.user_goals || (user?.learning_goals && typeof user.learning_goals === 'string' ? JSON.parse(user.learning_goals) : Array.isArray(user?.learning_goals) ? user.learning_goals : []);
    const formality = req.body.formality || 'friendly';
    const feedbackLanguage = req.body.feedback_language || 'en';

    const pythonApiUrl = process.env.PYTHON_API_URL || 'http://localhost:5000';
    const response = await axios.post(`${pythonApiUrl}/detailed_breakdown`, {
      ...req.body, // Pass all original request body
      user_level: userLevel,
      user_topics: userTopics,
      user_goals: userGoals,
      formality: formality,
      feedback_language: feedbackLanguage
    }, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 30000
    });

    res.json(response.data);
  } catch (error: any) {
    console.error('Detailed breakdown error:', error);
    res.status(500).json({ 
      error: 'Failed to get detailed breakdown',
      details: error.response?.data || error.message 
    });
  }
});

// Serve uploads directory statically for TTS audio
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Python API URL: ${process.env.PYTHON_API_URL || 'http://localhost:5000'}`);
  console.log('Note: Using SQLite database for temporary storage');
}); 