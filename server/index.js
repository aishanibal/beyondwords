require('dotenv').config();
const express = require('express');
// const mongoose = require('mongoose');
// const session = require('express-session');
// const passport = require('passport');
// const GoogleStrategy = require('passport-google-oauth20').Strategy;
const cors = require('cors');
const axios = require('axios');
const multer = require('multer');
const { OAuth2Client } = require('google-auth-library');
const path = require('path');
const fs = require('fs').promises;
const { exec } = require('child_process');
const bcrypt = require('bcrypt');
const { 
  createUser, 
  findUserByGoogleId, 
  findUserByEmail, 
  findUserById,
  updateUser,
  saveSession,
  getSession,
  getAllSessions,
  closeDatabase,
  getAllUsers
} = require('./database');
const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'your_super_secret_key';
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const app = express();
app.use(express.json());
app.use(cors({ origin: 'http://localhost:3000', credentials: true }));

// Multer configuration for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + '.wav');
  }
});

const upload = multer({ 
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'audio/wav' || file.mimetype === 'audio/webm') {
      cb(null, true);
    } else {
      cb(new Error('Only audio files are allowed'), false);
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
fs.mkdir(uploadsDir, { recursive: true }).catch(console.error);

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
function authenticateJWT(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'No token provided' });
  const token = authHeader.split(' ')[1];
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid token' });
    req.user = user;
    next();
  });
}

// Routes
app.get('/api/user', authenticateJWT, async (req, res) => {
  try {
    const user = await findUserById(req.user.userId);
    
    // Parse learning goals from JSON string to array
    if (user && user.learning_goals) {
      try {
        user.learning_goals = JSON.parse(user.learning_goals);
      } catch (e) {
        user.learning_goals = [];
      }
    }
    
    res.json({ user });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/api/logout', (req, res) => {
  res.json({ message: 'Logged out' });
});

// Audio analysis endpoint
app.post('/api/analyze', upload.single('audio'), async (req, res) => {
  try {
    console.log('POST /api/analyze called');
    if (!req.file) {
      console.error('No audio file provided');
      return res.status(400).json({ error: 'No audio file provided' });
    }

    // Use absolute path for audio file
    const audioFilePath = path.resolve(req.file.path);
    console.log('Received audio file:', audioFilePath);

    // Accept chatHistory from request body (for context-aware fast response)
    let chatHistory = [];
    if (req.body.chatHistory) {
      try {
        chatHistory = JSON.parse(req.body.chatHistory);
      } catch (e) {
        console.error('Error parsing chatHistory:', e);
        chatHistory = [];
      }
    }
    global.lastChatHistory = chatHistory; // Optionally store for session continuity

    // Call Python API for transcription and AI response (using ollama_client)
    const pythonApiUrl = process.env.PYTHON_API_URL || 'http://localhost:5001';
    
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
      
      const transcriptionResponse = await axios.post(`${pythonApiUrl}/transcribe`, {
        audio_file: audioFilePath,
        chat_history: chatHistory,
        language: req.body.language || 'en'
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
    } catch (transcriptionError) {
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
      let ttsVoice = 'Alex'; // Default to English (Alex is more reliable than Flo)
      if (language === 'es') ttsVoice = 'Monica'; // Spanish voice
      else if (language === 'hi') ttsVoice = 'Lekha'; // macOS Hindi voice
      else if (language === 'ja') ttsVoice = 'Otoya'; // macOS Japanese voice
      
      // Check if voice is available
      try {
        const voiceCheck = await new Promise((resolve, reject) => {
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
      
      await new Promise((resolve, reject) => {
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
      const fs = require('fs');
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
    global.lastAudioFile = audioFilePath;
    global.lastTranscription = transcription;
    global.lastChatHistory = chatHistory;

    console.log('Sending successful response to frontend');
    res.json({
      transcription: transcription,
      aiResponse: aiResponse,
      ttsUrl: ttsUrl,
      sessionId: null
    });

  } catch (error) {
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
app.post('/api/feedback', async (req, res) => {
  try {
    console.log('POST /api/feedback called');
    const { chatHistory } = req.body;
    
    if (!chatHistory || chatHistory.length === 0) {
      console.error('No chat history provided');
      return res.status(400).json({ error: 'No chat history provided' });
    }

    // Get the most recent user message (last recording)
    const userMessages = chatHistory.filter(msg => msg.sender === 'User');
    const lastUserMessage = userMessages[userMessages.length - 1];
    
    if (!lastUserMessage) {
      return res.status(400).json({ error: 'No user speech found' });
    }

    // Get the most recent transcription
    const lastTranscription = lastUserMessage.text;
    
    // Call Python API for detailed analysis of the most recent recording
    let pythonAnalysis = '';
    try {
      const pythonApiUrl = process.env.PYTHON_API_URL || 'http://localhost:5001';
      console.log('Requesting detailed analysis from Python API for most recent recording...');
      
      // Get the last audio file path from global variable
      const lastAudioFile = global.lastAudioFile;
      if (!lastAudioFile) {
        console.log('No audio file found for detailed analysis');
      } else {
        console.log('Using audio file for detailed analysis:', lastAudioFile);
        const analysisResponse = await axios.post(`${pythonApiUrl}/analyze`, {
          audio_file: lastAudioFile,
          transcription: lastTranscription,
          language: req.body.language || 'en'
        }, {
          headers: { 'Content-Type': 'application/json' },
          timeout: 60000
        });
        pythonAnalysis = analysisResponse.data.analysis || '';
        console.log('Python analysis received:', pythonAnalysis);
      }
    } catch (pythonError) {
      console.log('Python API not available for detailed analysis:', pythonError.message);
    }

    // Use Ollama Slow for detailed feedback
    console.log('Generating detailed feedback with Ollama Slow...');
    const ollamaResponse = await axios.post('http://localhost:11434/api/generate', {
      model: 'llama3.2',
      prompt: `You are an expert speech coach providing detailed analysis and feedback.

MOST RECENT SPEECH:
User said: "${lastTranscription}"

TECHNICAL ANALYSIS:
${pythonAnalysis || 'No technical analysis available'}

CHAT HISTORY CONTEXT:
${chatHistory.map(msg => `${msg.sender}: ${msg.text}`).join('\n')}

Provide a comprehensive speech analysis report that includes:

1. List all mismatched phonemes in the most recent speech.
2. Using the reference text, MOST IMPORTANT - point out grammar and sentence structure errors
3. Based on the stresses and hesitations, point out the most important words to work on

Keep the tone encouraging and professional. Format with clear sections and bullet points.`,
      stream: false
    }, {
      timeout: 60000  // 60 second timeout for detailed analysis
    });

    const feedback = ollamaResponse.data.response;
    console.log('Detailed feedback generated with Ollama Slow');

    res.json({ feedback: feedback });

  } catch (error) {
    console.error('Feedback error:', error);
    if (error.response) {
      console.error('Ollama error response:', error.response.data);
    }
    // Fallback response if Ollama is not available
    if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
      res.json({
        feedback: `📊 Detailed Analysis (Offline Mode)

Based on your most recent speech, here's what I can tell you:

🎯 Overall Assessment:
• Your speech was recorded successfully
• For detailed pronunciation analysis, please ensure Ollama is running

💡 Tips for Better Analysis:
• Speak clearly and at a moderate pace
• Try different phrases and sentences
• Practice regularly for best results

🔧 Technical Note:
The full analysis pipeline requires Ollama to be running. Please start Ollama for complete functionality.`
      });
    } else {
      res.status(500).json({ 
        error: 'Error getting feedback',
        details: error.message 
      });
    }
  }
});

// Save session endpoint
app.post('/api/save-session', async (req, res) => {
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
  } catch (error) {
    console.error('Save session error:', error);
    res.status(500).json({ error: 'Failed to save session', details: error.message });
  }
});

// Get user sessions
app.get('/api/sessions/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const sessions = await getAllSessions(userId);
    res.json({ sessions });
  } catch (error) {
    console.error('Get sessions error:', error);
    res.status(500).json({ error: 'Failed to get sessions' });
  }
});

// Get latest session
app.get('/api/sessions/:userId/latest', async (req, res) => {
  try {
    const { userId } = req.params;
    const session = await getSession(userId);
    res.json({ session });
  } catch (error) {
    console.error('Get latest session error:', error);
    res.status(500).json({ error: 'Failed to get latest session' });
  }
});

// Google OAuth token verification
app.post('/auth/google/token', async (req, res) => {
  try {
    const { credential } = req.body;
    
    // Verify the Google token
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID
    });
    
    const payload = ticket.getPayload();
    const { sub: googleId, email, name } = payload;
    
    let user = await findUserByGoogleId(googleId);
    
    if (!user) {
      user = await createUser({
        googleId,
        email,
        name,
        role: 'user',
        onboardingComplete: false
      });
    }
    
    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email, name: user.name },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({ user, token });
  } catch (error) {
    console.error('Google auth error:', error);
    res.status(400).json({ error: 'Invalid credential' });
  }
});

// Email/password registration
app.post('/auth/register', async (req, res) => {
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
      passwordHash,
      role: 'user'
    });
    
    res.json({ user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Email/password login with JWT
app.post('/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await findUserByEmail(email);
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });
    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) return res.status(401).json({ error: 'Invalid credentials' });
    const token = jwt.sign(
      { userId: user.id, email: user.email, name: user.name },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
    res.json({ token, user: { id: user.id, email: user.email, name: user.name } });
  } catch (error) {
    res.status(500).json({ error: 'Login failed' });
  }
});

// Onboarding route (protected)
app.post('/api/user/onboarding', authenticateJWT, async (req, res) => {
  try {
    const { language, proficiency, goals, practicePreference, motivation } = req.body;
    
    if (!language || !proficiency || !goals || !practicePreference || !motivation) {
      return res.status(400).json({ error: 'Missing required onboarding fields' });
    }
    
    // Convert goals array to JSON string for storage
    const goalsJson = JSON.stringify(goals);
    
    await updateUser(req.user.userId, {
      target_language: language,
      proficiency_level: proficiency,
      learning_goals: goalsJson,
      practice_preference: practicePreference,
      motivation: motivation,
      onboarding_complete: true
    });
    
    const user = await findUserById(req.user.userId);
    
    // Parse goals back to array for frontend
    if (user.learning_goals) {
      try {
        user.learning_goals = JSON.parse(user.learning_goals);
      } catch (e) {
        user.learning_goals = [];
      }
    }
    
    res.json({ user });
  } catch (error) {
    console.error('Onboarding error:', error);
    res.status(500).json({ error: 'Failed to save onboarding' });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    pythonApiUrl: process.env.PYTHON_API_URL || 'http://localhost:5001'
  });
});

// Test TTS endpoint
app.get('/api/test-tts', async (req, res) => {
  try {
    const testText = "Hello, this is a test of text to speech.";
    const ttsFileName = `test_tts_${Date.now()}.aiff`;
    const ttsFilePath = path.join(uploadsDir, ttsFileName);
    
    const sayCmd = `say -v Alex -o "${ttsFilePath}" "${testText}"`;
    console.log('Test TTS command:', sayCmd);
    
    await new Promise((resolve, reject) => {
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
    
    const fs = require('fs');
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
  } catch (error) {
    console.error('Test TTS error:', error);
    res.status(500).json({ error: 'Test TTS failed', details: error.message });
  }
});

// Admin: List all users
app.get('/api/admin/users', authenticateJWT, async (req, res) => {
  try {
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    const users = await getAllUsers();
    res.json({ users });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Admin: Promote user to admin
app.post('/api/admin/promote', authenticateJWT, async (req, res) => {
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
  } catch (error) {
    res.status(500).json({ error: 'Failed to promote user' });
  }
});

// Admin: Demote user to regular user
app.post('/api/admin/demote', authenticateJWT, async (req, res) => {
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
  } catch (error) {
    res.status(500).json({ error: 'Failed to demote user' });
  }
});

// Serve uploads directory statically for TTS audio
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Python API URL: ${process.env.PYTHON_API_URL || 'http://localhost:5001'}`);
  console.log('Note: Using SQLite database for temporary storage');
}); 