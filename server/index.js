require('dotenv').config();
const express = require('express');
// const mongoose = require('mongoose');
// const session = require('express-session');
// const passport = require('passport');
// const GoogleStrategy = require('passport-google-oauth20').Strategy;
const cors = require('cors');
const axios = require('axios');
const multer = require('multer');
// const { OAuth2Client } = require('google-auth-library');
const path = require('path');
const fs = require('fs').promises;
const { exec } = require('child_process');

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

// Routes
app.get('/api/user', async (req, res) => {
  try {
    // For now, return a mock user for testing
    // In production, you'd get this from the session/token
    res.json({ 
      id: 'mock-user-id', 
      name: 'Test User', 
      email: 'test@example.com',
      role: 'user'
    });
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

    // Call Python API for transcription only
    const pythonApiUrl = process.env.PYTHON_API_URL || 'http://localhost:5000';
    
    // Get transcription from Python API
    console.log('Sending transcription request to Python API:', `${pythonApiUrl}/transcribe`);
    let transcription = 'Speech recorded';
    try {
      const transcriptionResponse = await axios.post(`${pythonApiUrl}/transcribe`, {
        audio_file: audioFilePath
      }, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 30000
      });
      console.log('Transcription response:', transcriptionResponse.data);
      transcription = transcriptionResponse.data.transcription || 'Speech recorded';
    } catch (transcriptionError) {
      console.error('Transcription error:', transcriptionError.message);
      // Continue with default transcription
    }

    // Accept chatHistory from request body (for context-aware fast response)
    let chatHistory = [];
    if (req.body.chatHistory) {
      try {
        chatHistory = JSON.parse(req.body.chatHistory);
      } catch (e) {
        chatHistory = [];
      }
    }
    global.lastChatHistory = chatHistory; // Optionally store for session continuity

    // Ollama health check before generating response
    const ollamaUrl = 'http://localhost:11434';
    let ollamaReady = false;
    for (let attempt = 1; attempt <= 5; attempt++) {
      try {
        const health = await axios.get(`${ollamaUrl}/api/tags`, { timeout: 3000 });
        if (health.status === 200) {
          console.log(`Ollama is ready (attempt ${attempt})`);
          ollamaReady = true;
          break;
        }
      } catch (e) {
        console.log(`Waiting for Ollama... (attempt ${attempt})`);
        await new Promise(r => setTimeout(r, 1000));
      }
    }
    if (!ollamaReady) {
      console.error('Ollama did not become ready in time. Returning fallback.');
      return res.json({
        transcription: transcription,
        aiResponse: 'Thank you for your speech! Keep practicing and you\'ll improve.',
        ttsUrl: null,
        sessionId: null
      });
    }

    // Use Ollama Fast for immediate response (no analysis needed) with retry logic
    let aiResponse = 'Thank you for your speech!';
    let ollamaSuccess = false;
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        // Always format chat history as a string
        const chatHistoryString = (chatHistory && chatHistory.length > 0)
          ? chatHistory.map(msg => `${msg.sender}: ${msg.text}`).join('\n')
          : '';
        const ollamaPrompt = `You are a helpful speech coach. Here is the conversation so far:\n${chatHistoryString}\nThe user just said: "${transcription}". Respond in a way that continues the conversation like you're having a regular convo with the user. Keep it around 20 words but it's not strict.`;
        console.log(`Generating fast response with Ollama (attempt ${attempt})...`);
        const ollamaResponse = await axios.post(`${ollamaUrl}/api/generate`, {
          model: 'llama3.2',
          prompt: ollamaPrompt,
          stream: false
        }, {
          timeout: 5000  // 5 second timeout for fast response
        });
        aiResponse = ollamaResponse.data.response;
        console.log('Ollama fast response generated:', aiResponse);
        ollamaSuccess = true;
        break;
      } catch (ollamaError) {
        console.error(`Ollama error (attempt ${attempt}):`, ollamaError.message);
        if (attempt < 3) {
          console.log('Retrying Ollama in 2 seconds...');
          await new Promise(r => setTimeout(r, 2000));
        }
      }
    }
    if (!ollamaSuccess) {
      aiResponse = 'Thank you for your speech! Keep practicing and you\'ll improve.';
    }

    // Generate text-to-speech for the response using macOS 'say'
    let ttsUrl = null;
    try {
      const ttsFileName = `tts_${Date.now()}.wav`;
      const ttsFilePath = path.join(uploadsDir, ttsFileName);
      await new Promise((resolve, reject) => {
        exec(`say -v Flo -o "${ttsFilePath}" --data-format=LEI16@22050 "${aiResponse.replace(/\"/g, '\\"')}"`, (error) => {
          if (error) reject(error);
          else resolve();
        });
      });
      ttsUrl = `/uploads/${ttsFileName}`;
      console.log('TTS audio generated at:', ttsUrl);
    } catch (ttsError) {
      console.log('TTS not available:', ttsError);
      ttsUrl = null;
    }

    // Store the audio file path and chat history globally for detailed feedback later
    global.lastAudioFile = audioFilePath;
    global.lastTranscription = transcription;
    global.lastChatHistory = chatHistory;

    res.json({
      transcription: transcription,
      aiResponse: aiResponse,
      ttsUrl: ttsUrl,
      sessionId: null
    });

  } catch (error) {
    console.error('Analysis error:', error);
    if (error.response) {
      console.error('Error response:', error.response.data);
    }
    // Simple fallback
    res.json({
      transcription: 'Speech recorded',
      aiResponse: 'Thank you for your speech! Keep practicing.',
      ttsUrl: null,
      sessionId: 'offline-session'
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
      const pythonApiUrl = process.env.PYTHON_API_URL || 'http://localhost:5000';
      console.log('Requesting detailed analysis from Python API for most recent recording...');
      
      // Get the last audio file path from global variable
      const lastAudioFile = global.lastAudioFile;
      if (!lastAudioFile) {
        console.log('No audio file found for detailed analysis');
      } else {
        console.log('Using audio file for detailed analysis:', lastAudioFile);
        const analysisResponse = await axios.post(`${pythonApiUrl}/analyze`, {
          audio_file: lastAudioFile,
          transcription: lastTranscription
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

📊 SESSION OVERVIEW
- Analysis of the most recent speech sample
- Overall speaking patterns observed

🎯 PRONUNCIATION FEEDBACK
- Specific sounds or words that need attention
- Common pronunciation challenges identified

💡 IMPROVEMENT SUGGESTIONS
- 3-5 specific tips for better pronunciation
- Practice exercises or techniques

🌟 ENCOURAGEMENT
- Positive reinforcement
- Progress acknowledgment

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

// Save session endpoint (commented out for now)
// app.post('/api/save-session', async (req, res) => {
//   try {
//     if (!req.user || !req.user._id) {
//       return res.status(401).json({ error: 'Not authenticated' });
//     }
//     const { chatHistory } = req.body;
//     if (!chatHistory || !Array.isArray(chatHistory) || chatHistory.length === 0) {
//       return res.status(400).json({ error: 'No chat history provided' });
//     }
//     // Save the session
//     const session = new AnalysisSession({
//       userId: req.user._id,
//       transcription: chatHistory.map(msg => msg.text).join('\n'),
//       aiResponse: chatHistory.filter(msg => msg.sender === 'AI').map(msg => msg.text).join('\n'),
//       // audioFile and detailedFeedback can be omitted or set to null
//     });
//     await session.save();
//     res.json({ success: true, sessionId: session._id });
//   } catch (error) {
//     console.error('Save session error:', error);
//     res.status(500).json({ error: 'Failed to save session', details: error.message });
//   }
// });

// Google OAuth token verification (commented out for now)
// app.post('/auth/google/token', async (req, res) => {
//   try {
//     const { credential } = req.body;
    
//     const ticket = await googleClient.verifyIdToken({
//       idToken: credential,
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

//     res.json({ user: user });
//   } catch (error) {
//     console.error('Google auth error:', error);
//     res.status(400).json({ error: 'Invalid credential' });
//   }
// });

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    pythonApiUrl: process.env.PYTHON_API_URL || 'http://localhost:5000'
  });
});

// Serve uploads directory statically for TTS audio
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Python API URL: ${process.env.PYTHON_API_URL || 'http://localhost:5000'}`);
  console.log('Note: Running without database (MongoDB disabled)');
}); 