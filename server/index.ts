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
  updateConversationSynopsis,
  deleteConversation,
  updateConversationPersona,
  updateConversationDescription,
  createLanguageDashboard,
  getUserLanguageDashboards,
  getLanguageDashboard,
  updateLanguageDashboard,
  deleteLanguageDashboard,
  getUserStreak,
  createConversationWithInitialMessage,
  createPersona,
  getUserPersonas,
  deletePersona,
  User,
  LanguageDashboard,
  Session,
  Conversation,
  Message,
  Persona,
  updateConversationLearningGoals
} from './supabase-db';
import { OAuth2Client } from 'google-auth-library';
import path from 'path';
import fs from 'fs'; // Use fs, not fs/promises
import { exec } from 'child_process';
import bcrypt from 'bcryptjs';
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
app.use((req: Request, res: Response, next: NextFunction) => {
  console.log('INCOMING REQUEST:', req.method, req.url, 'Headers:', req.headers);
  next();
});

app.use(express.json());
app.use(cors({ 
  origin: [
    'http://localhost:3000',
    'https://speakbeyondwords-sigma.vercel.app',
    'https://speakbeyondwords-sigma.vercel.app/',
    'https://speakbeyondwords-sigma.vercel.app/*'
  ], 
  credentials: false,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin']
}));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    message: 'BeyondWords Express server is running'
  });
});

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

// JWT middleware - handles both custom JWT and Supabase tokens
function authenticateJWT(req: ExpressRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'No token provided' });
  const token = authHeader.split(' ')[1];
  
  // Try custom JWT first
  jwt.verify(token, JWT_SECRET, async (err: any, user: any) => {
    if (!err && user) {
      req.user = user;
      return next();
    }
    
    // If custom JWT fails, try Supabase token validation
    try {
      // Decode the Supabase JWT (without verification for now)
      const decoded = jwt.decode(token) as any;
      if (decoded && decoded.sub && decoded.email) {
        // Create a user object compatible with our system
        req.user = {
          userId: decoded.sub,
          email: decoded.email,
          name: decoded.user_metadata?.name || decoded.user_metadata?.full_name || 'User'
        };
        return next();
      }
    } catch (supabaseErr) {
      console.error('Supabase token validation failed:', supabaseErr);
    }
    
    return res.status(403).json({ error: 'Invalid token' });
  });
}

// Routes

// Optional auth middleware: if Authorization header is present, enforce JWT; otherwise allow through
function optionalAuthenticateJWT(req: ExpressRequest, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.trim() !== '') {
      return authenticateJWT(req, res, next);
    }
    return next();
  } catch (e) {
    return next();
  }
}
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

    // Ensure onboarding_complete is included in response
    const userResponse = {
      ...user,
      onboarding_complete: Boolean(user.onboarding_complete)
    };

    res.json({ user: userResponse });
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
    const result = await getUserStreak(userId, language);
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
    const pythonApiUrl = process.env.PYTHON_API_URL || 'https://beyondwords.onrender.com';
    
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
      aiResponse = transcriptionResponse.data.response || 'Thank you for your speech!';
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

    // Generate text-to-speech for the response using Gemini TTS API
    let ttsUrl = null;
    const language = req.body.language || 'en';
    try {
      const ttsFileName = `tts_${Date.now()}.aiff`;
      const ttsFilePath = path.join(uploadsDir, ttsFileName);
      
      console.log('Generating TTS using Gemini API for language:', language);
      console.log('TTS text length:', aiResponse.length);
      
      // Call Python API for Gemini TTS
      const pythonApiUrl = (process.env.PYTHON_API_URL || 'https://beyondwords.onrender.com').replace(/\/$/, '');
      const ttsResponse = await axios.post(`${pythonApiUrl}/generate_tts`, {
        text: aiResponse,
        language_code: language,
        output_path: ttsFilePath
      }, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 30000
      });
      
      if (ttsResponse.data.success && ttsResponse.data.output_path) {
        // Use the relative path returned by Python API for serving
        const relativePath = ttsResponse.data.output_path;
        const fileName = path.basename(relativePath);
        ttsUrl = `/files/${fileName}`;
        console.log('TTS audio generated at:', ttsUrl);
        console.log('TTS relative path:', relativePath);
      } else {
        console.error('TTS generation failed:', ttsResponse.data.error);
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

// Detailed feedback endpoint (optional auth)
app.post('/api/feedback', optionalAuthenticateJWT as any, async (req: Request, res: Response) => {
  try {
    console.log('POST /api/feedback called');
    console.log('Auth present:', !!req.headers.authorization);
    console.log('Request body keys:', Object.keys(req.body || {}));
    const { user_input, context, language, user_level, user_topics, romanization_display } = req.body;
    
    if (!user_input || !context) {
      console.log('Missing required fields:', { user_input: !!user_input, context: !!context });
      return res.status(400).json({ error: 'Missing user_input or context' });
    }
    
    console.log('Parsed parameters:', { user_input_len: (user_input||'').length, context_len: (context||'').length, language, user_level, user_topics_count: Array.isArray(user_topics) ? user_topics.length : 0 });
    
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
      const pythonApiUrl = (process.env.PYTHON_API_URL || 'https://beyondwords.onrender.com').replace(/\/$/, '');
      const pythonResponse = await axios.post(`${pythonApiUrl}/feedback`, {
        chat_history,
        recognized_text: user_input,
        language,
        user_level,
        user_topics,
        feedback_language: 'en', // Default to English for now
        romanization_display
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
    const session = await saveSession(userId, chatHistory, language);
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
    const sessions = await getAllSessions(userId);
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
    const session = await getSession(userId);
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

    console.log('Google auth - User created/found:', user);
    console.log('Google auth - User response:', userResponse);
    console.log('Google auth - onboarding_complete value:', user.onboarding_complete);
    console.log('Google auth - Boolean onboarding_complete:', Boolean(user.onboarding_complete));

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
      role: 'user',
      onboarding_complete: false
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

// JWT token exchange endpoint (for Supabase auth integration)
app.post('/auth/exchange', async (req: Request, res: Response) => {
  try {
    const { email, name } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }
    
    console.log('[AUTH_EXCHANGE] Token exchange request for email:', email);
    
    // Find or create user by email
    let user = await findUserByEmail(email);
    
    if (!user) {
      // Create new user if doesn't exist
      console.log('[AUTH_EXCHANGE] Creating new user for email:', email);
      const newUser = {
        email,
        name: name || email.split('@')[0],
        google_id: undefined, // This is from Supabase, not Google OAuth
        role: 'user' as const,
        onboarding_complete: false
      };
      
      try {
        user = await createUser(newUser);
        console.log('[AUTH_EXCHANGE] New user created with ID:', user.id);
      } catch (error: any) {
        console.error('[AUTH_EXCHANGE] Failed to create user:', error);
        return res.status(500).json({ error: 'Failed to create user' });
      }
    } else {
      console.log('[AUTH_EXCHANGE] Found existing user with ID:', user.id);
    }
    
    // Ensure user exists before proceeding
    if (!user) {
      return res.status(500).json({ error: 'User not found or created' });
    }
    
    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    console.log('[AUTH_EXCHANGE] JWT token generated for user:', user.id);
    
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
    console.error('[AUTH_EXCHANGE] Token exchange error:', error);
    res.status(500).json({ error: 'Token exchange failed' });
  }
});

// Onboarding route (protected) - Creates first language dashboard
app.post('/api/user/onboarding', authenticateJWT, async (req: Request, res: Response) => {
  try {
    console.log('Onboarding request received:', req.body);
    console.log('User from token:', req.user);
    const { language, proficiency, talkTopics, learningGoals, practicePreference } = req.body;
    
    console.log('Extracted fields:', { language, proficiency, talkTopics, learningGoals, practicePreference });
    
    if (!language || !proficiency || !talkTopics || !learningGoals || !practicePreference) {
      console.log('Missing required fields validation failed');
      return res.status(400).json({ error: 'Missing required onboarding fields' });
    }
    
    // Ensure user exists in database (create if not found)
    let user = await findUserById(req.user.userId);
    if (!user) {
      console.log('User not found in database, creating new user record');
      user = await createUser({
        id: req.user.userId, // Use the Supabase user ID
        email: req.user.email || '',
        name: req.user.name || '',
        role: 'user',
        onboarding_complete: false
      });
      console.log('Created user record:', user);
    }
    
    // Create the first language dashboard (primary)
    console.log('Creating language dashboard for user:', req.user.userId);
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
    console.log('Created dashboard:', dashboard);
    
    // Update user to mark onboarding as complete
    console.log('Updating user onboarding status');
    await updateUser(req.user.userId, {
      onboarding_complete: true
    });
    
    // Get updated user
    const updatedUser = await findUserById(req.user.userId);
    console.log('Updated user:', updatedUser);
    
    res.json({ 
      user: {
        ...updatedUser,
        onboarding_complete: Boolean(updatedUser?.onboarding_complete)
      },
      dashboard 
    });
  } catch (error: any) {
    console.error('Onboarding error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ error: 'Failed to save onboarding', details: error.message });
  }
});

// Profile update route (protected)
app.put('/api/user/profile', authenticateJWT, async (req: Request, res: Response) => {
  try {
    console.log('Profile update request received:', req.body);
    console.log('User ID from JWT:', req.user.userId);
    console.log('Request headers:', req.headers);
    
    const { name, email, preferences } = req.body;
    
    console.log('Extracted data:', { name, email, preferences });
    
    // Validate required fields
    if (!name || !email) {
      console.log('Validation failed: missing name or email');
      console.log('Name value:', name, 'Email value:', email);
      return res.status(400).json({ error: 'Name and email are required' });
    }
    
    console.log('Updating user with data:', { name, email, preferences });
    
    // Update user profile
    const updateData: any = { name, email };
    if (preferences) {
      updateData.preferences = preferences;
    }
    
    await updateUser(req.user.userId, updateData);
    
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
    
    console.log('[DEBUG] Updating language dashboard for language:', language);
    console.log('[DEBUG] Updates received:', updates);
    console.log('[DEBUG] User ID:', req.user.userId);
    
    // Check if dashboard exists
    const existingDashboard = await getLanguageDashboard(req.user.userId, language);
    if (!existingDashboard) {
      console.log('[DEBUG] Dashboard not found');
      return res.status(404).json({ error: 'Language dashboard not found' });
    }
    
    console.log('[DEBUG] Existing dashboard:', existingDashboard);
    
    await updateLanguageDashboard(req.user.userId, language, updates);
    
    // Get updated dashboard
    const dashboard = await getLanguageDashboard(req.user.userId, language);
    console.log('[DEBUG] Updated dashboard:', dashboard);
    
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
    const { language, title, topics, formality, description, usesPersona, personaId, learningGoals } = req.body;
    console.log('🔄 SERVER: Creating conversation with formality:', formality);
    console.log('🔄 SERVER: Creating conversation with description:', description);
    console.log('🔄 SERVER: Creating conversation with persona info:', { usesPersona, personaId });
    console.log('🔄 SERVER: Creating conversation with learning goals:', learningGoals);
    console.log('🔄 SERVER: Full request body:', req.body);
    // Basic validation to provide clearer error messages
    if (!req.user?.userId) {
      return res.status(401).json({ error: 'AUTH_ERROR: Missing or invalid user' });
    }
    if (!language || !title || !Array.isArray(topics) || topics.length === 0) {
      return res.status(400).json({ error: 'VALIDATION_ERROR: Missing required fields (language, title, topics[])' });
    }

    // Find the language dashboard ID for this language
    let languageDashboardId: number | null = null;
    try {
      const dashboard = await getLanguageDashboard(req.user.userId, language);
      languageDashboardId = dashboard?.id ?? null;
    } catch (e) {
      console.log('⚠️ SERVER: Could not find language dashboard for language:', language);
      languageDashboardId = null;
    }

    // Generate AI intro message first (before creating conversation)
    let aiIntro = 'Hello! What would you like to talk about today?';
    let ttsUrl = null;
    
    try {
      const user = await findUserById(req.user.userId);
      const userLevel = user?.proficiency_level || 'beginner';
      const userTopics = user?.talk_topics && typeof user.talk_topics === 'string' ? JSON.parse(user.talk_topics) : Array.isArray(user?.talk_topics) ? user.talk_topics : [];
      const pythonApiUrl = (process.env.PYTHON_API_URL || 'https://beyondwords.onrender.com').replace(/\/$/, '');
      const topicsToSend = topics && topics.length > 0 ? topics : userTopics;
      
      try {
        const requestPayload = {
          chat_history: [],
          language,
          user_level: userLevel,
          user_topics: topicsToSend,
          formality: formality || 'friendly',
          description: description || null
        };
        
        console.log('🐍 [PYTHON DEBUG] Calling /initial_message with payload:', JSON.stringify(requestPayload, null, 2));
        console.log('🐍 [PYTHON DEBUG] Python API URL:', `${pythonApiUrl}/initial_message`);
        console.log('🐍 [PYTHON DEBUG] Request headers:', { 'Content-Type': 'application/json' });
        console.log('🐍 [PYTHON DEBUG] Timeout: 30000ms');
        
        const aiRes = await axios.post(`${pythonApiUrl}/initial_message`, requestPayload, {
          headers: { 'Content-Type': 'application/json' },
          timeout: 30000
        });
        
        console.log('🐍 [PYTHON DEBUG] /initial_message response status:', aiRes.status);
        console.log('🐍 [PYTHON DEBUG] /initial_message response headers:', aiRes.headers);
        console.log('🐍 [PYTHON DEBUG] /initial_message response data:', JSON.stringify(aiRes.data, null, 2));
        
        if (aiRes.data && aiRes.data.message) {
          aiIntro = aiRes.data.message.trim() || 'Hello! What would you like to talk about today?';
          console.log('🐍 [PYTHON DEBUG] Using AI message:', aiIntro);
        } else {
          console.log('🐍 [PYTHON DEBUG] No message in response, using fallback');
          aiIntro = 'Hello! What would you like to talk about today?';
        }
      } catch (err: any) {
        console.error('🐍 [PYTHON DEBUG] /initial_message error details:');
        console.error('🐍 [PYTHON DEBUG] Error message:', err.message);
        console.error('🐍 [PYTHON DEBUG] Error code:', err.code);
        console.error('🐍 [PYTHON DEBUG] Error status:', err.response?.status);
        console.error('🐍 [PYTHON DEBUG] Error response data:', err.response?.data);
        console.error('🐍 [PYTHON DEBUG] Error response headers:', err.response?.headers);
        console.error('🐍 [PYTHON DEBUG] Full error object:', err);
        
        if (err.response?.status === 429) {
          console.log('🐍 [PYTHON DEBUG] Rate limit hit - using fallback message');
        } else if (err.response?.status === 401) {
          console.log('🐍 [PYTHON DEBUG] Authentication error - check API keys');
        } else if (err.response?.status === 500) {
          console.log('🐍 [PYTHON DEBUG] Python API internal error');
        }
        
        aiIntro = 'Hello! What would you like to talk about today?';
      }
      
      // Generate TTS for the initial AI message (don't let TTS failure block conversation)
      try {
        if (aiIntro && aiIntro.trim()) {
          const ttsResult = await generateTTSWithDebug(aiIntro, language);
          ttsUrl = ttsResult.ttsUrl;
          console.log('Generated TTS for initial message:', ttsUrl);
          console.log('TTS Debug info:', ttsResult.debug);
          
          // If TTS failed, continue without it - don't block conversation creation
          if (!ttsUrl) {
            console.log('⚠️ TTS generation failed, continuing without audio');
          }
        }
      } catch (ttsError) {
        console.error('⚠️ TTS generation error (non-blocking):', ttsError);
        ttsUrl = null;
      }
    } catch (err) {
      console.error('Error generating AI intro message:', err);
      // Continue with fallback message
    }

    // Create conversation and AI message atomically
    console.log('🔄 SERVER: Creating conversation with initial AI message atomically...');
    let conversation, aiMessage;
    
    try {
      const result = await createConversationWithInitialMessage(
        req.user.userId, 
        languageDashboardId, 
        title, 
        topics, 
        formality, 
        description, 
        usesPersona, 
        personaId, 
        learningGoals,
        aiIntro
      );
      
      conversation = result.conversation;
      aiMessage = result.aiMessage;
      
      console.log('✅ SERVER: Atomic conversation creation result:', conversation);
      console.log('✅ SERVER: AI message created:', aiMessage?.id);
      
      if (!conversation || !conversation.id) {
        throw new Error('Atomic conversation create returned no id');
      }
    } catch (atomicError) {
      console.error('❌ SERVER: Atomic conversation creation failed, falling back to separate operations:', atomicError);
      
      // Fallback: Create conversation first, then message separately
      conversation = await createConversation(req.user.userId, languageDashboardId, title, topics, formality, description, usesPersona, personaId, learningGoals);
      console.log('🔄 SERVER: Fallback conversation creation result:', conversation);
      
      if (!conversation || !conversation.id) {
        console.error('❌ SERVER: Failed to create conversation in fallback mode');
        return res.status(500).json({ error: 'DB_ERROR: Both atomic and fallback conversation creation failed' });
      }
      
      // Try to add the AI message separately
      try {
        aiMessage = await addMessage(conversation.id, 'AI', aiIntro, 'text', undefined, undefined, 1);
        console.log('✅ SERVER: Fallback AI message created:', aiMessage?.id);
      } catch (addMessageError) {
        console.error('❌ SERVER: Failed to add AI message in fallback mode:', addMessageError);
        aiMessage = null;
        // Don't fail the entire request - conversation exists, just no initial message
      }
    }

    // Return the actual AI intro text and TTS URL for the frontend
    res.json({ conversation, aiMessage: { text: aiIntro, ttsUrl } });
  } catch (error: any) {
    console.error('❌ SERVER: Create conversation error:', error);
    const message = typeof error?.message === 'string' ? error.message : 'Unknown error';
    res.status(500).json({ error: `CREATE_ERROR: ${message}` });
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

app.get('/api/conversations/:id', optionalAuthenticateJWT as any, async (req: Request, res: Response) => {
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

app.post('/api/conversations/:id/messages', optionalAuthenticateJWT as any, async (req: Request, res: Response) => {
  try {
    console.log('🔄 SERVER: Adding message to conversation:', req.params.id);
    const { sender, text, messageType, audioFilePath, detailedFeedback, message_order, romanized_text } = req.body;
    console.log('📝 SERVER: Message details:', { sender, text: text.substring(0, 50) + '...', messageType, message_order, romanized_text: romanized_text ? 'present' : 'none' });

    const message = await addMessage(
      Number(req.params.id),
      sender,
      text,
      messageType,
      audioFilePath,
      detailedFeedback,
      message_order,
      romanized_text
    );

    res.json({ message });
  } catch (error: any) {
    console.error('❌ SERVER: Add message error:', error);
    res.status(500).json({ error: 'Failed to add message' });
  }
});

app.put('/api/conversations/:id/title', optionalAuthenticateJWT as any, async (req: Request, res: Response) => {
  try {
    const { title, synopsis, progress_data } = req.body;
    const conversationId = Number(req.params.id);
    
    console.log('🔍 [UPDATE_TITLE] Updating conversation:', conversationId, { 
      title: title ? title.substring(0, 50) + '...' : null, 
      synopsis: synopsis ? synopsis.substring(0, 100) + '...' : null, 
      progress_data: progress_data 
    });
    
    let changes = 0;
    
    // Update title if provided
    if (title) {
      console.log('🔍 [UPDATE_TITLE] Updating title for conversation:', conversationId);
      const titleResult = await updateConversationTitle(conversationId, title);
      changes += titleResult.changes;
      console.log('🔍 [UPDATE_TITLE] Title updated successfully, changes:', titleResult.changes);
    }
    
    // Update synopsis if provided
    if (synopsis) {
      console.log('🔍 [UPDATE_TITLE] Updating synopsis for conversation:', conversationId);
      try {
        const synopsisResult = await updateConversationSynopsis(conversationId, synopsis, progress_data);
        changes += synopsisResult.changes;
        console.log('🔍 [UPDATE_TITLE] Synopsis updated successfully, changes:', synopsisResult.changes);
      } catch (synopsisError: any) {
        console.error('🔍 [UPDATE_TITLE] Failed to update synopsis:', synopsisError);
        console.error('🔍 [UPDATE_TITLE] Synopsis error details:', {
          message: synopsisError.message,
          stack: synopsisError.stack,
          conversationId,
          synopsisLength: synopsis.length,
          progressDataKeys: progress_data ? Object.keys(progress_data) : null
        });
        throw synopsisError;
      }
    }
    
    console.log('🔍 [UPDATE_TITLE] Total changes made:', changes);
    res.json({ success: true, changes });
  } catch (error: any) {
    console.error('🔍 [UPDATE_TITLE] Update conversation title/synopsis error:', error);
    console.error('🔍 [UPDATE_TITLE] Error details:', {
      message: error.message,
      stack: error.stack,
      conversationId: req.params.id,
      body: req.body
    });
    res.status(500).json({ error: 'Failed to update conversation title/synopsis', details: error.message });
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

app.patch('/api/conversations/:id', optionalAuthenticateJWT as any, async (req: Request, res: Response) => {
  try {
    const conversationId = parseInt(req.params.id);
    const { usesPersona, personaId, synopsis, progress_data, description } = req.body;
    
    console.log('🔄 [CONVERSATION_UPDATE] Updating conversation:', {
      conversationId,
      usesPersona,
      personaId,
      synopsis: synopsis ? synopsis.substring(0, 100) + '...' : undefined,
      progress_data,
      description
    });
    
    // Update conversation with synopsis and progress data
    if (synopsis !== undefined) {
      console.log('🔄 [CONVERSATION_UPDATE] Updating synopsis and progress data');
      await updateConversationSynopsis(conversationId, synopsis, progress_data);
    }
    
    // Update conversation with persona information
    if (usesPersona !== undefined) {
      console.log('🔄 [CONVERSATION_UPDATE] Updating persona information');
      await updateConversationPersona(conversationId, usesPersona, personaId);
    }
    
    // Update conversation description if provided
    if (description !== undefined) {
      console.log('🔄 [CONVERSATION_UPDATE] Updating conversation description');
      await updateConversationDescription(conversationId, description);
    }
    
    console.log('🔄 [CONVERSATION_UPDATE] Conversation updated successfully');
    res.json({ message: 'Conversation updated successfully' });
  } catch (error: any) {
    console.error('🔄 [CONVERSATION_UPDATE] Error updating conversation:', error);
    res.status(500).json({ error: 'Failed to update conversation' });
  }
});

// Text suggestions endpoint
app.post('/api/suggestions', authenticateJWT, async (req: Request, res: Response) => {
  try {
    console.log('🔍 [NODE_SERVER] POST /api/suggestions called');
    console.log('🔍 [NODE_SERVER] Request body:', req.body);
    console.log('🔍 [NODE_SERVER] User ID:', req.user?.userId);
    const { conversationId, language } = req.body;
    
    // Get user data for personalized suggestions
    const user = await findUserById(req.user.userId);
    const userLevel = req.body.user_level || user?.proficiency_level || 'beginner';
    const userTopics = req.body.user_topics || (user?.talk_topics && typeof user.talk_topics === 'string' ? JSON.parse(user.talk_topics) : Array.isArray(user?.talk_topics) ? user.talk_topics : []);
    const userGoals = req.body.user_goals || (user?.learning_goals && typeof user.learning_goals === 'string' ? JSON.parse(user.learning_goals) : Array.isArray(user?.learning_goals) ? user.learning_goals : []);
    
    let chatHistory: any[] = [];
    
    // First, try to use chat history from frontend if provided
    if (req.body.chat_history && Array.isArray(req.body.chat_history)) {
      chatHistory = req.body.chat_history;
      console.log('🔍 [NODE_SERVER] Using chat history from frontend:', chatHistory.length, 'messages');
    } else if (conversationId) {
      console.log('🔍 [NODE_SERVER] Getting conversation history for ID:', conversationId);
      // Get conversation history from database as fallback
      const conversation = await getConversationWithMessages(Number(conversationId));
      console.log('🔍 [NODE_SERVER] Conversation data:', conversation ? 'found' : 'not found');
      if (conversation) {
        console.log('🔍 [NODE_SERVER] Messages count:', conversation.messages?.length || 0);
        chatHistory = (conversation.messages || []).map(msg => ({
          sender: msg.sender,
          text: msg.text,
          timestamp: msg.created_at
        }));
        console.log('🔍 [NODE_SERVER] Mapped chat history from database:', chatHistory.length, 'messages');
      }
    } else {
      console.log('🔍 [NODE_SERVER] No conversationId or chat_history provided, using empty chat history');
    }
    
    // Call Python API for suggestions
    try {
      const pythonApiUrl = (process.env.PYTHON_API_URL || 'https://beyondwords.onrender.com').replace(/\/$/, '');
      const pythonRequestData = {
        chat_history: chatHistory,
        language: language || user?.target_language || 'en',
        user_level: userLevel,
        user_topics: userTopics,
        // Include optional fields so Python routes can fully personalize output
        formality: req.body.formality || 'friendly',
        feedback_language: req.body.feedback_language || 'en',
        user_goals: userGoals,
        description: req.body.description || null
      };
      
      console.log('🔍 [NODE_SERVER] Calling Python API for suggestions:', {
        url: `${pythonApiUrl}/suggestions`,
        data: pythonRequestData
      });
      
      const pythonResponse = await axios.post(`${pythonApiUrl}/suggestions`, pythonRequestData, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 30000
      });
      
      console.log('🔍 [NODE_SERVER] Python suggestions response:', {
        status: pythonResponse.status,
        suggestionsCount: pythonResponse.data.suggestions?.length || 0,
        data: pythonResponse.data
      });
      res.json({ suggestions: pythonResponse.data.suggestions });
    } catch (pythonError: any) {
      console.error('Python API not available for suggestions:', pythonError.message);
      if (pythonError.response) {
        console.error('🔍 [NODE_SERVER] Python error response:', {
          status: pythonError.response.status,
          data: pythonError.response.data
        });
      }
      
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

// Text suggestions endpoint (without authentication for testing)
app.post('/api/suggestions-test', async (req: Request, res: Response) => {
  try {
    console.log('POST /api/suggestions-test called');
    const { conversationId, language, user_level, user_topics, user_goals } = req.body;
    
    let chatHistory: any[] = [];
    if (conversationId) {
      // Get conversation history (without user authentication)
      try {
        const conversation = await getConversationWithMessages(Number(conversationId));
        if (conversation) {
          chatHistory = (conversation.messages || []).map(msg => ({
            sender: msg.sender,
            text: msg.text,
            timestamp: msg.created_at
          }));
        }
      } catch (e) {
        console.log('Could not fetch conversation history:', e);
      }
    }
    
    // Call Python API for suggestions
    try {
      const pythonApiUrl = (process.env.PYTHON_API_URL || 'https://beyondwords.onrender.com').replace(/\/$/, '');
      const pythonResponse = await axios.post(`${pythonApiUrl}/suggestions`, {
        chat_history: chatHistory,
        language: language || 'en',
        user_level: user_level || 'beginner',
        user_topics: user_topics || [],
        user_goals: user_goals || []
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
      const pythonApiUrl = (process.env.PYTHON_API_URL || 'https://beyondwords.onrender.com').replace(/\/$/, '');
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
    res.status(500).json({ error: 'Error translating text', details: error.message });
  }
});

// Explain suggestion endpoint
app.post('/api/explain_suggestion', authenticateJWT, async (req: Request, res: Response) => {
  try {
    console.log('POST /api/explain_suggestion called');
    const { suggestion_text, chatHistory, language, user_level, user_topics, formality, feedback_language, user_goals } = req.body;
    
    if (!suggestion_text) {
      return res.status(400).json({ error: 'No suggestion text provided' });
    }
    
    // Call Python API for explanation
    try {
      const pythonApiUrl = (process.env.PYTHON_API_URL || 'https://beyondwords.onrender.com').replace(/\/$/, '');
      const pythonResponse = await axios.post(`${pythonApiUrl}/explain_suggestion`, {
        suggestion_text: suggestion_text,
        chatHistory: chatHistory || [],
        language: language || 'en',
        user_level: user_level || 'beginner',
        user_topics: user_topics || [],
        formality: formality || 'friendly',
        feedback_language: feedback_language || 'en',
        user_goals: user_goals || []
      }, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 30000
      });
      
      console.log('Python explanation received');
      res.json(pythonResponse.data);
    } catch (pythonError: any) {
      console.error('Python API not available for explanation:', pythonError.message);
      
      // Fallback response if Python API fails
      res.json({
        translation: "Explanation service temporarily unavailable",
        explanation: "The explanation service is currently unavailable. Please try again later.",
        error: "Python API not available"
      });
    }
  } catch (error: any) {
    console.error('Explain suggestion error:', error);
    res.status(500).json({ error: 'Error explaining suggestion', details: error.message });
  }
});

// Explain suggestion endpoint (without authentication for testing)
app.post('/api/explain_suggestion-test', async (req: Request, res: Response) => {
  try {
    console.log('POST /api/explain_suggestion-test called');
    const { suggestion_text, chatHistory, language, user_level, user_topics, formality, feedback_language, user_goals } = req.body;
    
    if (!suggestion_text) {
      return res.status(400).json({ error: 'No suggestion text provided' });
    }
    
    // Call Python API for explanation
    try {
      const pythonApiUrl = (process.env.PYTHON_API_URL || 'https://beyondwords.onrender.com').replace(/\/$/, '');
      const pythonResponse = await axios.post(`${pythonApiUrl}/explain_suggestion`, {
        suggestion_text: suggestion_text,
        chatHistory: chatHistory || [],
        language: language || 'en',
        user_level: user_level || 'beginner',
        user_topics: user_topics || [],
        formality: formality || 'friendly',
        feedback_language: feedback_language || 'en',
        user_goals: user_goals || []
      }, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 30000
      });
      
      console.log('Python explanation received');
      res.json(pythonResponse.data);
    } catch (pythonError: any) {
      console.error('Python API not available for explanation:', pythonError.message);
      
      // Fallback response if Python API fails
      res.json({
        translation: "Explanation service temporarily unavailable",
        explanation: "The explanation service is currently unavailable. Please try again later.",
        error: "Python API not available"
      });
    }
  } catch (error: any) {
    console.error('Explain suggestion error:', error);
    res.status(500).json({ error: 'Error explaining suggestion', details: error.message });
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

    const pythonApiUrl = process.env.PYTHON_API_URL || 'https://beyondwords.onrender.com';
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

    const pythonApiUrl = process.env.PYTHON_API_URL || 'https://beyondwords.onrender.com';
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

// Personas endpoints
app.post('/api/personas', optionalAuthenticateJWT as any, async (req: Request, res: Response) => {
  try {
    const { name, description, topics, formality, language, conversationId } = req.body;
    const userId = (req.user as any)?.userId || null;

    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }

    const persona = await createPersona(userId, {
      name,
      description: description || '',
      topics: topics || [],
      formality: formality || 'neutral',
      language: language || 'en',
      conversationId: conversationId
    });

    res.status(201).json({ persona });
  } catch (error: any) {
    console.error('Error creating persona:', error);
    res.status(500).json({ error: 'Failed to create persona', details: error.message });
  }
});

app.get('/api/personas', optionalAuthenticateJWT as any, async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any)?.userId || null;
    const personas = await getUserPersonas(userId);
    res.json({ personas });
  } catch (error: any) {
    console.error('Error fetching personas:', error);
    res.status(500).json({ error: 'Failed to fetch personas', details: error.message });
  }
});

app.delete('/api/personas/:id', authenticateJWT, async (req: Request, res: Response) => {
  try {
    const personaId = parseInt(req.params.id);
    const result = await deletePersona(personaId);
    
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Persona not found' });
    }
    
    res.json({ message: 'Persona deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting persona:', error);
    res.status(500).json({ error: 'Failed to delete persona', details: error.message });
  }
});

// TTS endpoint for generating audio for any text (with authentication)
app.post('/api/tts', optionalAuthenticateJWT as any, async (req: Request, res: Response) => {
  try {
    const { text, language } = req.body;
    
    console.log('🎯 [EXPRESS_TTS] TTS request received:');
    console.log('🎯 [EXPRESS_TTS]   text:', text);
    console.log('🎯 [EXPRESS_TTS]   language:', language);
    console.log('🎯 [EXPRESS_TTS]   request body:', req.body);
    console.log('🎯 [EXPRESS_TTS]   user ID:', req.user?.userId);
    
    if (!text || !text.trim()) {
      console.log('🎯 [EXPRESS_TTS] Error: Text is required');
      return res.status(400).json({ error: 'Text is required' });
    }
    
    const lang = language || 'en';
    console.log('🎯 [EXPRESS_TTS] Using language:', lang);
    
    // Check Python API health first
    const isHealthy = await checkPythonAPIHealth();
    if (!isHealthy) {
      return res.status(503).json({ 
        error: 'Python API is not available',
        details: 'The TTS service is temporarily unavailable. Please try again later.'
      });
    }
    
    // Generate TTS for the text
    console.log('🎯 [EXPRESS_TTS] Calling generateTTS...');
    const ttsUrl = await generateTTS(text, lang);
    console.log('🎯 [EXPRESS_TTS] generateTTS result:', ttsUrl);
    
    if (ttsUrl) {
      console.log('🎯 [EXPRESS_TTS] TTS generation successful, returning URL:', ttsUrl);
      res.json({ ttsUrl });
    } else {
      console.log('🎯 [EXPRESS_TTS] TTS generation failed, returning error');
      res.status(500).json({ error: 'Failed to generate TTS' });
    }
  } catch (error: any) {
    console.error('TTS endpoint error:', error);
    res.status(500).json({ error: 'TTS generation failed', details: error.message });
  }
});

  // TTS endpoint for testing (without authentication)
  app.post('/api/tts-test', async (req: Request, res: Response) => {
    try {
      const { text, language } = req.body;
      
      if (!text || !text.trim()) {
        return res.status(400).json({ error: 'Text is required' });
      }
      
      const lang = language || 'en';
      
      console.log(`🎯 [TTS DEBUG] TTS request received:`, {
        textLength: text.length,
        textPreview: text.substring(0, 50) + '...',
        language: lang,
        timestamp: new Date().toISOString()
      });
      
      // Check Python API health first
      const isHealthy = await checkPythonAPIHealth();
      if (!isHealthy) {
        console.log(`🎯 [TTS DEBUG] Python API health check failed`);
        return res.status(503).json({ 
          error: 'Python API is not available',
          details: 'The TTS service is temporarily unavailable. Please try again later.',
          debug: {
            service_used: 'none',
            fallback_reason: 'Python API unavailable',
            admin_settings: {},
            cost_estimate: 'unknown'
          }
        });
      }
      
      console.log(`🎯 [TTS DEBUG] Python API health check passed`);
      
      // Generate TTS for the text with debug info
      const ttsResult = await generateTTSWithDebug(text, lang);
      
      if (ttsResult.ttsUrl) {
        console.log(`🎯 [TTS DEBUG] TTS generation successful:`, {
          url: ttsResult.ttsUrl,
          serviceUsed: ttsResult.debug?.service_used,
          costEstimate: ttsResult.debug?.cost_estimate
        });
        res.json({ 
          ttsUrl: ttsResult.ttsUrl,
          debug: ttsResult.debug
        });
      } else {
        console.log(`🎯 [TTS DEBUG] TTS generation failed`);
        res.status(500).json({ 
          error: 'Failed to generate TTS',
          debug: ttsResult.debug || {
            service_used: 'none',
            fallback_reason: 'All TTS services failed',
            admin_settings: {},
            cost_estimate: 'unknown'
          }
        });
      }
    } catch (error: any) {
      console.error('🎯 [TTS DEBUG] TTS test endpoint error:', error);
      res.status(500).json({ 
        error: 'TTS generation failed', 
        details: error.message,
        debug: {
          service_used: 'none',
          fallback_reason: 'Exception occurred',
          admin_settings: {},
          cost_estimate: 'unknown',
          error: error.message
        }
      });
    }
  });

// Quick translation endpoint
app.post('/api/quick_translation', authenticateJWT, async (req: Request, res: Response) => {
  try {
    console.log('🔍 [NODE_SERVER] POST /api/quick_translation called');
    console.log('🔍 [NODE_SERVER] Request body:', req.body);
    console.log('🔍 [NODE_SERVER] User ID:', req.user?.userId);
    const { ai_message, chat_history, language, user_level, user_topics, formality, feedback_language, user_goals, description } = req.body;
    
    if (!ai_message) {
      return res.status(400).json({ error: 'No AI message provided' });
    }
    
    // Call Python API for quick translation
    try {
      const pythonApiUrl = (process.env.PYTHON_API_URL || 'https://beyondwords.onrender.com').replace(/\/$/, '');
      const pythonRequestData = {
        ai_message: ai_message,
        chat_history: chat_history || [], // Forward chat history for context
        language: language || 'en',
        user_level: user_level || 'beginner',
        user_topics: user_topics || [],
        formality: formality || 'friendly',
        feedback_language: feedback_language || 'en',
        user_goals: user_goals || [],
        description: description || null
      };
      
      console.log('🔍 [NODE_SERVER] Calling Python API:', {
        url: `${pythonApiUrl}/quick_translation`,
        data: pythonRequestData
      });
      
      const pythonResponse = await axios.post(`${pythonApiUrl}/quick_translation`, pythonRequestData, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 30000
      });
      
      console.log('🔍 [NODE_SERVER] Python quick translation response:', {
        status: pythonResponse.status,
        data: pythonResponse.data
      });
      res.json(pythonResponse.data);
    } catch (pythonError: any) {
      console.error('Python API not available for quick translation:', pythonError.message);
      
      // Fallback response if Python API fails
      res.json({
        translation: "Quick translation service temporarily unavailable",
        error: "Python API not available"
      });
    }
  } catch (error: any) {
    console.error('Quick translation error:', error);
    res.status(500).json({ error: 'Error getting quick translation', details: error.message });
  }
});

// AI Response endpoint (for frontend compatibility)
app.post('/api/ai_response', authenticateJWT, async (req: Request, res: Response) => {
  try {
    console.log('🔍 [AI_RESPONSE] POST /api/ai_response called');
    console.log('🔍 [AI_RESPONSE] Request body:', req.body);
    console.log('🔍 [AI_RESPONSE] User ID:', req.user?.userId);
    
    const { transcription, chat_history, language, user_level, user_topics, formality, feedback_language, user_goals } = req.body;
    
    if (!transcription) {
      return res.status(400).json({ error: 'No transcription provided' });
    }
    
    // Call Python API for AI response
    try {
      const pythonApiUrl = (process.env.PYTHON_API_URL || 'https://beyondwords.onrender.com').replace(/\/$/, '');
      const pythonRequestData = {
        transcription: transcription,
        chat_history: chat_history || [],
        language: language || 'en',
        user_level: user_level || 'beginner',
        user_topics: user_topics || [],
        formality: formality || 'friendly',
        feedback_language: feedback_language || 'en',
        user_goals: user_goals || []
      };
      
      console.log('🔍 [AI_RESPONSE] Calling Python API:', {
        url: `${pythonApiUrl}/ai_response`,
        data: pythonRequestData
      });
      
      const pythonResponse = await axios.post(`${pythonApiUrl}/ai_response`, pythonRequestData, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 30000
      });
      
      console.log('🔍 [AI_RESPONSE] Python AI response received:', {
        status: pythonResponse.status,
        data: pythonResponse.data
      });
      res.json(pythonResponse.data);
    } catch (pythonError: any) {
      console.error('🔍 [AI_RESPONSE] Python API not available:', pythonError.message);
      
      // Fallback response if Python API fails
      res.json({
        response: "I'm sorry, I'm having trouble processing your request right now. Please try again later.",
        error: "Python API not available"
      });
    }
  } catch (error: any) {
    console.error('🔍 [AI_RESPONSE] AI response error:', error);
    res.status(500).json({ error: 'Error getting AI response', details: error.message });
  }
});

// Conversation summary endpoint (for frontend compatibility)
app.post('/api/conversation-summary', authenticateJWT, async (req: Request, res: Response) => {
  try {
    console.log('🔍 [CONVERSATION_SUMMARY] POST /api/conversation-summary called');
    console.log('🔍 [CONVERSATION_SUMMARY] Request body:', req.body);
    console.log('🔍 [CONVERSATION_SUMMARY] User ID:', req.user?.userId);
    
    const { chat_history, subgoal_instructions, user_topics, target_language, feedback_language, is_continued_conversation, conversation_id } = req.body;
    
    if (!chat_history || !Array.isArray(chat_history)) {
      return res.status(400).json({ error: 'No chat history provided' });
    }
    
    // Call Python API for conversation summary
    try {
      const pythonApiUrl = (process.env.PYTHON_API_URL || 'https://beyondwords.onrender.com').replace(/\/$/, '');
      const pythonRequestData = {
        chat_history: chat_history,
        subgoal_instructions: subgoal_instructions || '',
        user_topics: user_topics || [],
        target_language: target_language || 'en',
        feedback_language: feedback_language || 'en',
        is_continued_conversation: is_continued_conversation || false
      };
      
      console.log('🔍 [CONVERSATION_SUMMARY] Calling Python API:', {
        url: `${pythonApiUrl}/conversation_summary`,
        data: pythonRequestData
      });
      
      const pythonResponse = await axios.post(`${pythonApiUrl}/conversation_summary`, pythonRequestData, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 30000
      });
      
      console.log('🔍 [CONVERSATION_SUMMARY] Python conversation summary received:', {
        status: pythonResponse.status,
        data: pythonResponse.data
      });
      // Persist learning_goals on the conversation if available
      try {
        if (conversation_id && req.user?.userId) {
          const userRecord = await findUserById(req.user.userId);
          let userGoals: string[] = [];
          if (userRecord && (userRecord as any).learning_goals) {
            const raw = (userRecord as any).learning_goals;
            userGoals = Array.isArray(raw) ? raw : JSON.parse(raw);
          }
          if (Array.isArray(userGoals) && userGoals.length > 0) {
            await updateConversationLearningGoals(Number(conversation_id), userGoals);
          }
        }
      } catch (persistErr) {
        console.warn('⚠️ [CONVERSATION_SUMMARY] Failed to persist learning_goals:', persistErr);
      }

      res.json(pythonResponse.data);
    } catch (pythonError: any) {
      console.error('🔍 [CONVERSATION_SUMMARY] Python API not available:', pythonError.message);
      
      // Fallback response if Python API fails
      res.json({
        success: false,
        summary: {
          title: "Conversation Summary",
          synopsis: "Summary generation is temporarily unavailable. Please try again later.",
          learningGoals: []
        },
        error: "Python API not available"
      });
    }
  } catch (error: any) {
    console.error('🔍 [CONVERSATION_SUMMARY] Conversation summary error:', error);
    res.status(500).json({ error: 'Error generating conversation summary', details: error.message });
  }
});

// Serve uploads directory statically for TTS audio with proper CORS headers
app.use('/uploads', (req, res, next) => {
  // Set CORS headers for audio files
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  res.header('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour
  next();
}, express.static(path.join(__dirname, 'uploads')));

// Also serve files from the current directory (where Python API might create files)
app.use('/files', (req, res, next) => {
  // Set CORS headers for TTS files
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  res.header('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour
  next();
}, express.static(path.join(__dirname, '..')));

// Proxy endpoint to serve TTS files from Python API
app.get('/files/:filename', async (req: Request, res: Response) => {
  try {
    const filename = req.params.filename;
    console.log(`🔍 [TTS_PROXY] Serving TTS file: ${filename}`);
    
    // First try to serve from local uploads directory
    const localPath = path.join(uploadsDir, filename);
    if (fs.existsSync(localPath)) {
      console.log(`🔍 [TTS_PROXY] Serving from local path: ${localPath}`);
      res.sendFile(localPath);
      return;
    }
    
    // If not found locally, try to fetch from Python API
    const pythonApiUrl = (process.env.PYTHON_API_URL || 'https://beyondwords.onrender.com').replace(/\/$/, '');
    const pythonFileUrl = `${pythonApiUrl}/uploads/${filename}`;
    
    console.log(`🔍 [TTS_PROXY] File not found locally, trying Python API: ${pythonFileUrl}`);
    
    try {
      const response = await axios.get(pythonFileUrl, {
        responseType: 'stream',
        timeout: 10000
      });
      
      console.log(`🔍 [TTS_PROXY] Python API response status: ${response.status}`);
      
      // Set appropriate headers
      res.set({
        'Content-Type': 'audio/wav',
        'Cache-Control': 'public, max-age=3600',
        'Access-Control-Allow-Origin': '*'
      });
      
      // Pipe the response from Python API to client
      response.data.pipe(res);
      
    } catch (pythonError: any) {
      console.error(`🔍 [TTS_PROXY] Failed to fetch from Python API: ${pythonError.message}`);
      console.error(`🔍 [TTS_PROXY] Python API error details:`, pythonError.response?.status, pythonError.response?.data);
      res.status(404).json({ error: 'TTS file not found' });
    }
    
  } catch (error: any) {
    console.error(`🔍 [TTS_PROXY] Error serving TTS file: ${error.message}`);
    res.status(500).json({ error: 'Failed to serve TTS file' });
  }
});

// Helper function to check Python API health
async function checkPythonAPIHealth(): Promise<boolean> {
  try {
    const pythonApiUrl = process.env.PYTHON_API_URL || 'https://beyondwords.onrender.com';
    console.log(`🔍 Checking Python API health at: ${pythonApiUrl}/health`);
    
    const response = await axios.get(`${pythonApiUrl}/health`, {
      timeout: 5000
    });
    
    console.log(`✅ Python API health check successful:`, response.data);
    return true;
  } catch (error: any) {
    console.error(`❌ Python API health check failed:`, error.message);
    return false;
  }
}

// Helper function to generate TTS for any text using Gemini TTS API
async function generateTTS(text: string, language: string): Promise<string | null> {
  const result = await generateTTSWithDebug(text, language);
  return result.ttsUrl;
}

// Helper function to generate TTS with debug information
async function generateTTSWithDebug(text: string, language: string): Promise<{ ttsUrl: string | null; debug: any }> {
  try {
    // Use .aiff extension for macOS compatibility
    const ttsFileName = `tts_${Date.now()}.aiff`;
    const ttsFilePath = path.join(uploadsDir, ttsFileName);
    
    console.log('🎯 [TTS DEBUG] Generating TTS using admin-controlled system for language:', language);
    console.log('🎯 [TTS DEBUG] TTS text length:', text.length);
    
    // Call Python API for TTS with debug info
    const pythonApiUrl = (process.env.PYTHON_API_URL || 'https://beyondwords.onrender.com').replace(/\/$/, '');
    console.log(`🎯 [TTS DEBUG] Calling Python API at: ${pythonApiUrl}/generate_tts`);
    console.log(`🎯 [TTS DEBUG] Request payload: text='${text.substring(0, 50)}...', language='${language}', output_path='${ttsFilePath}'`);
    
    const ttsRequestPayload = {
      text: text,
      language_code: language,
      output_path: ttsFilePath
    };
    
    console.log('🎯 [TTS DEBUG] TTS request payload:', JSON.stringify(ttsRequestPayload, null, 2));
    console.log('🎯 [TTS DEBUG] TTS request headers:', { 'Content-Type': 'application/json' });
    console.log('🎯 [TTS DEBUG] TTS timeout: 30000ms');
    
    const ttsResponse = await axios.post(`${pythonApiUrl}/generate_tts`, ttsRequestPayload, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 30000
    });
    
    console.log(`🎯 [TTS DEBUG] Python API response status: ${ttsResponse.status}`);
    console.log(`🎯 [TTS DEBUG] Python API response data:`, ttsResponse.data);
    
    // Extract debug information from Python API response
    const debugInfo = {
      service_used: ttsResponse.data.service_used || 'unknown',
      fallback_reason: ttsResponse.data.fallback_reason || 'none',
      admin_settings: ttsResponse.data.admin_settings || {},
      cost_estimate: ttsResponse.data.cost_estimate || 'unknown',
      request_id: ttsResponse.data.request_id || 'unknown',
      python_debug: ttsResponse.data.debug || {}
    };
    
    console.log(`🎯 [TTS DEBUG] Extracted debug info:`, debugInfo);
    
    if (ttsResponse.data.success && ttsResponse.data.output_path) {
      // Use the relative path returned by Python API for serving
      const relativePath = ttsResponse.data.output_path;
      const actualPath = ttsResponse.data.actual_path;
      
      console.log(`🎯 [TTS DEBUG] Relative path from Python API: ${relativePath}`);
      console.log(`🎯 [TTS DEBUG] Actual path from Python API: ${actualPath}`);
      
      // The Python API creates files on its own server, so we need to serve them directly
      // from the Python API server, not from our Express server
      const fileName = path.basename(relativePath);
      const ttsUrl = `${pythonApiUrl}/uploads/${fileName}`;
      
      console.log('🎯 [TTS DEBUG] TTS audio will be served at:', ttsUrl);
      console.log('🎯 [TTS DEBUG] File extension:', path.extname(relativePath));
      
      return {
        ttsUrl: ttsUrl,
        debug: {
          ...debugInfo,
          relative_path: relativePath,
          actual_path: actualPath,
          serving_url: ttsUrl
        }
      };
    } else {
      console.error('🎯 [TTS DEBUG] TTS generation failed:', ttsResponse.data.error);
      return {
        ttsUrl: null,
        debug: {
          ...debugInfo,
          fallback_reason: 'Python API returned failure',
          error: ttsResponse.data.error || 'Unknown error'
        }
      };
    }
  } catch (ttsError: any) {
    console.error('🎯 [TTS DEBUG] TTS error details:');
    console.error('🎯 [TTS DEBUG] Error message:', ttsError.message);
    console.error('🎯 [TTS DEBUG] Error code:', ttsError.code);
    console.error('🎯 [TTS DEBUG] Error status:', ttsError.response?.status);
    console.error('🎯 [TTS DEBUG] Error response data:', ttsError.response?.data);
    console.error('🎯 [TTS DEBUG] Error response headers:', ttsError.response?.headers);
    console.error('🎯 [TTS DEBUG] Full error object:', ttsError);
    
    if (ttsError.response?.status === 429) {
      console.log('🎯 [TTS DEBUG] Rate limit hit - TTS generation failed');
    } else if (ttsError.response?.status === 401) {
      console.log('🎯 [TTS DEBUG] Authentication error - check TTS API keys');
    } else if (ttsError.response?.status === 500) {
      console.log('🎯 [TTS DEBUG] Python API internal error for TTS');
    } else if (ttsError.code === 'ECONNREFUSED') {
      console.log('🎯 [TTS DEBUG] Connection refused - Python API not reachable');
    } else if (ttsError.code === 'ETIMEDOUT') {
      console.log('🎯 [TTS DEBUG] Request timeout - Python API too slow');
    }
    
    return {
      ttsUrl: null,
      debug: {
        service_used: 'none',
        fallback_reason: 'Exception occurred',
        admin_settings: {},
        cost_estimate: 'unknown',
        error: ttsError.message,
        error_type: ttsError.name,
        error_status: ttsError.response?.status,
        error_code: ttsError.code
      }
    };
  }
}

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Python API URL: ${process.env.PYTHON_API_URL || 'https://beyondwords.onrender.com'}`);
  console.log('Note: Using SQLite database for temporary storage');
}); // Force redeploy Mon Sep  8 16:16:47 EDT 2025
