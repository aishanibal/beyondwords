"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require('dotenv').config();
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const multer_1 = __importDefault(require("multer"));
const database_1 = require("./database");
const google_auth_library_1 = require("google-auth-library");
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs")); // Use fs, not fs/promises
const child_process_1 = require("child_process");
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const axios_1 = __importDefault(require("axios"));
const JWT_SECRET = process.env.JWT_SECRET || 'your_super_secret_key';
const googleClient = new google_auth_library_1.OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const globalAny = global;
const app = (0, express_1.default)();
// Log every incoming request for debugging
app.use((req, res, next) => {
    console.log('INCOMING REQUEST:', req.method, req.url, 'Headers:', req.headers);
    next();
});
app.use(express_1.default.json());
app.use((0, cors_1.default)({ origin: 'http://localhost:3000', credentials: false }));
// Multer configuration for file uploads
const storage = multer_1.default.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadsDir); // Use absolute path
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + '.wav');
    }
});
// Ensure uploads directory exists using absolute path
const uploadsDir = path_1.default.join(__dirname, 'uploads');
if (!fs_1.default.existsSync(uploadsDir)) {
    fs_1.default.mkdirSync(uploadsDir, { recursive: true });
}
const upload = (0, multer_1.default)({
    storage: storage,
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'audio/wav' || file.mimetype === 'audio/webm') {
            cb(null, true);
        }
        else {
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
function authenticateJWT(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader)
        return res.status(401).json({ error: 'No token provided' });
    const token = authHeader.split(' ')[1];
    jsonwebtoken_1.default.verify(token, JWT_SECRET, (err, user) => {
        if (err)
            return res.status(403).json({ error: 'Invalid token' });
        req.user = user;
        next();
    });
}
// Routes
app.get('/api/user', authenticateJWT, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        let user = yield (0, database_1.findUserById)(req.user.userId);
        if (!user) {
            // Create a new user record if not found
            user = yield (0, database_1.createUser)({
                // id is auto-incremented, so don't set it
                email: req.user.email || '',
                name: req.user.name || '',
                role: 'user',
                onboarding_complete: false
            });
        }
        // Parse arrays from JSON strings
        if (user && typeof user.talk_topics === 'string') {
            try {
                user.talk_topics = JSON.parse(user.talk_topics);
            }
            catch (e) {
                user.talk_topics = [];
            }
        }
        if (user && user.learning_goals) {
            try {
                user.learning_goals = typeof user.learning_goals === 'string'
                    ? JSON.parse(user.learning_goals)
                    : user.learning_goals;
            }
            catch (e) {
                user.learning_goals = [];
            }
        }
        res.json({ user });
    }
    catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
}));
app.get('/api/logout', (req, res) => {
    res.json({ message: 'Logged out' });
});
// Add streak endpoint
app.get('/api/user/streak', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    console.log('[STREAK DEBUG] /api/user/streak called', { userId: ((_a = req.user) === null || _a === void 0 ? void 0 : _a.id) || req.query.userId, language: req.query.language });
    let userId = (_b = req.user) === null || _b === void 0 ? void 0 : _b.id;
    if (!userId && req.query.userId) {
        userId = Array.isArray(req.query.userId) ? req.query.userId[0] : req.query.userId;
    }
    let language = req.query.language;
    if (Array.isArray(language))
        language = language[0];
    if (typeof userId !== 'string' || typeof language !== 'string') {
        return res.status(400).json({ error: 'Missing user or language' });
    }
    try {
        const result = yield (0, database_1.getUserStreak)(Number(userId), language);
        res.json(result);
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
}));
// Audio analysis endpoint
app.post('/api/analyze', authenticateJWT, upload.single('audio'), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
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
        let chatHistory = [];
        if (req.body.chatHistory) {
            try {
                chatHistory = JSON.parse(req.body.chatHistory);
            }
            catch (e) {
                console.error('Error parsing chatHistory:', e);
                chatHistory = [];
            }
        }
        globalAny.lastChatHistory = chatHistory; // Optionally store for session continuity
        // Get user preferences from form data (preferred) or fall back to database
        const user = yield (0, database_1.findUserById)(req.user.userId);
        const userLevel = req.body.user_level || (user === null || user === void 0 ? void 0 : user.proficiency_level) || 'beginner';
        const userTopics = req.body.user_topics ? JSON.parse(req.body.user_topics) : ((user === null || user === void 0 ? void 0 : user.talk_topics) && typeof user.talk_topics === 'string' ? JSON.parse(user.talk_topics) : Array.isArray(user === null || user === void 0 ? void 0 : user.talk_topics) ? user.talk_topics : []);
        const userGoals = req.body.user_goals ? JSON.parse(req.body.user_goals) : ((user === null || user === void 0 ? void 0 : user.learning_goals) && typeof user.learning_goals === 'string' ? JSON.parse(user.learning_goals) : Array.isArray(user === null || user === void 0 ? void 0 : user.learning_goals) ? user.learning_goals : []);
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
            if (!fs_1.default.existsSync(audioFilePath)) {
                throw new Error(`Audio file does not exist: ${audioFilePath}`);
            }
            const fileStats = fs_1.default.statSync(audioFilePath);
            console.log('Audio file size:', fileStats.size, 'bytes');
            const transcriptionResponse = yield axios_1.default.post(`${pythonApiUrl}/transcribe`, {
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
        }
        catch (transcriptionError) {
            console.error('=== PYTHON API FAILED ===');
            console.error('Python API call failed:', transcriptionError.message);
            console.error('Error details:', ((_a = transcriptionError.response) === null || _a === void 0 ? void 0 : _a.data) || transcriptionError.code || 'No additional details');
            console.log('Falling back to basic transcription and response');
            pythonApiAvailable = false;
            // Keep the default values
        }
        // Generate text-to-speech for the response using macOS 'say'
        let ttsUrl = null;
        const language = req.body.language || 'en';
        try {
            const ttsFileName = `tts_${Date.now()}.wav`;
            const ttsFilePath = path_1.default.join(uploadsDir, ttsFileName);
            // Choose voice based on language with fallback
            let ttsVoice = 'Karen'; // Default to English (Alex is more reliable than Flo)
            if (language === 'es')
                ttsVoice = 'Mónica'; // Spanish voice
            else if (language === 'hi')
                ttsVoice = 'Lekha'; // macOS Hindi voice
            else if (language === 'ja')
                ttsVoice = 'Otoya'; // macOS Japanese voice
            // Check if voice is available
            try {
                yield new Promise((resolve, reject) => {
                    (0, child_process_1.exec)(`say -v ${ttsVoice} "test"`, (error) => {
                        if (error)
                            reject(error);
                        else
                            resolve();
                    });
                });
            }
            catch (voiceError) {
                console.log(`Voice ${ttsVoice} not available, using default`);
                ttsVoice = 'Alex'; // Fallback to Alex
            }
            const sayCmd = `say -v ${ttsVoice} -o "${ttsFilePath}" --data-format=LEI16@22050 "${aiResponse.replace(/\"/g, '\\"')}"`;
            console.log('TTS voice:', ttsVoice);
            console.log('TTS command:', sayCmd);
            console.log('TTS text length:', aiResponse.length);
            yield new Promise((resolve, reject) => {
                (0, child_process_1.exec)(sayCmd, (error) => {
                    if (error) {
                        console.error('TTS command failed:', error);
                        reject(error);
                    }
                    else {
                        console.log('TTS command completed successfully');
                        resolve();
                    }
                });
            });
            // Check if file was created
            if (fs_1.default.existsSync(ttsFilePath)) {
                const stats = fs_1.default.statSync(ttsFilePath);
                console.log('TTS file created, size:', stats.size, 'bytes');
                ttsUrl = `/uploads/${ttsFileName}`;
                console.log('TTS audio generated at:', ttsUrl);
            }
            else {
                console.error('TTS file was not created');
                ttsUrl = null;
            }
        }
        catch (ttsError) {
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
    }
    catch (error) {
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
}));
// Detailed feedback endpoint
app.post('/api/feedback', authenticateJWT, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
            .map((line) => {
            const [sender, ...rest] = line.split(':');
            return { sender: sender.trim(), text: rest.join(':').trim() };
        });
        console.log('Parsed chat_history:', chat_history);
        // Call Python API for detailed feedback
        let feedback = '';
        try {
            const pythonApiUrl = process.env.PYTHON_API_URL || 'http://localhost:5000';
            const pythonResponse = yield axios_1.default.post(`${pythonApiUrl}/feedback`, {
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
        }
        catch (pythonError) {
            console.error('Python API not available for feedback:', pythonError.message);
            feedback = 'Error: Could not get detailed feedback from Python API.';
        }
        res.json({ feedback });
    }
    catch (error) {
        console.error('Feedback error:', error);
        res.status(500).json({ error: 'Error getting feedback', details: error.message });
    }
}));
// Store detailed feedback for a specific message
app.post('/api/messages/:messageId/feedback', authenticateJWT, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
        yield new Promise((resolve, reject) => {
            const { db } = require('./database');
            db.run(updateSql, [feedback, messageId], function (err) {
                if (err) {
                    reject(err);
                }
                else {
                    resolve({ changes: this.changes });
                }
            });
        });
        res.json({ success: true, message: 'Feedback stored successfully' });
    }
    catch (error) {
        console.error('Store feedback error:', error);
        res.status(500).json({ error: 'Error storing feedback', details: error.message });
    }
}));
// Save session endpoint
app.post('/api/save-session', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { userId, chatHistory, language = 'en' } = req.body;
        if (!userId) {
            return res.status(401).json({ error: 'User ID required' });
        }
        if (!chatHistory || !Array.isArray(chatHistory) || chatHistory.length === 0) {
            return res.status(400).json({ error: 'No chat history provided' });
        }
        // Save the session
        const session = yield (0, database_1.saveSession)(Number(userId), chatHistory, language);
        res.json({ success: true, sessionId: session.id });
    }
    catch (error) {
        console.error('Save session error:', error);
        res.status(500).json({ error: 'Failed to save session', details: error.message });
    }
}));
// Get user sessions
app.get('/api/sessions/:userId', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { userId } = req.params;
        const sessions = yield (0, database_1.getAllSessions)(Number(userId));
        res.json({ sessions });
    }
    catch (error) {
        console.error('Get sessions error:', error);
        res.status(500).json({ error: 'Failed to get sessions' });
    }
}));
// Get latest session
app.get('/api/sessions/:userId/latest', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { userId } = req.params;
        const session = yield (0, database_1.getSession)(Number(userId));
        res.json({ session });
    }
    catch (error) {
        console.error('Get latest session error:', error);
        res.status(500).json({ error: 'Failed to get latest session' });
    }
}));
// Google OAuth token verification
app.post('/auth/google/token', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { credential } = req.body;
        // Verify the Google token
        const ticket = yield googleClient.verifyIdToken({
            idToken: credential,
            audience: process.env.GOOGLE_CLIENT_ID
        });
        const payload = ticket.getPayload();
        const { sub: googleId, email, name } = payload || { sub: '', email: '', name: '' };
        let user = yield (0, database_1.findUserByGoogleId)(googleId);
        if (!user) {
            user = yield (0, database_1.createUser)({
                googleId,
                email,
                name,
                role: 'user',
                onboarding_complete: false
            });
        }
        // Generate JWT token
        const token = jsonwebtoken_1.default.sign({ userId: user.id, email: user.email, name: user.name }, JWT_SECRET, { expiresIn: '7d' });
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
    }
    catch (error) {
        console.error('Google auth error:', error);
        res.status(400).json({ error: 'Invalid credential' });
    }
}));
// Email/password registration
app.post('/auth/register', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { name, email, password } = req.body;
        // Check if user already exists
        const existingUser = yield (0, database_1.findUserByEmail)(email);
        if (existingUser) {
            return res.status(400).json({ error: 'User already exists' });
        }
        // Hash password
        const passwordHash = yield bcrypt_1.default.hash(password, 10);
        // Create user
        const user = yield (0, database_1.createUser)({
            email,
            name,
            password_hash: passwordHash,
            role: 'user'
        });
        // Generate JWT token for immediate login
        const token = jsonwebtoken_1.default.sign({ userId: user.id, email: user.email, name: user.name }, JWT_SECRET, { expiresIn: '7d' });
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
    }
    catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Registration failed' });
    }
}));
// Email/password login with JWT
app.post('/auth/login', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email, password } = req.body;
        const user = yield (0, database_1.findUserByEmail)(email);
        // Check if user exists
        if (!user)
            return res.status(401).json({ error: 'Invalid credentials' });
        // Check if user has a password (not a Google-only account)
        if (!user.password_hash) {
            return res.status(401).json({ error: 'This email is associated with a Google account. Please sign in with Google.' });
        }
        // Verify password
        const isValid = yield bcrypt_1.default.compare(password, user.password_hash);
        if (!isValid)
            return res.status(401).json({ error: 'Invalid credentials' });
        // Generate JWT token
        const token = jsonwebtoken_1.default.sign({ userId: user.id, email: user.email, name: user.name }, JWT_SECRET, { expiresIn: '7d' });
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
    }
    catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Login failed' });
    }
}));
// Onboarding route (protected) - Creates first language dashboard
app.post('/api/user/onboarding', authenticateJWT, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        console.log('Onboarding request received:', req.body);
        const { language, proficiency, talkTopics, learningGoals, practicePreference } = req.body;
        console.log('Extracted fields:', { language, proficiency, talkTopics, learningGoals, practicePreference });
        if (!language || !proficiency || !talkTopics || !learningGoals || !practicePreference) {
            console.log('Missing required fields validation failed');
            return res.status(400).json({ error: 'Missing required onboarding fields' });
        }
        // Create the first language dashboard (primary)
        const dashboard = yield (0, database_1.createLanguageDashboard)(req.user.userId, language, proficiency, talkTopics, learningGoals, practicePreference, 'en', // feedbackLanguage
        true // isPrimary as boolean
        );
        // Update user to mark onboarding as complete
        yield (0, database_1.updateUser)(req.user.userId, {
            onboarding_complete: true
        });
        const user = yield (0, database_1.findUserById)(req.user.userId);
        res.json({
            user: Object.assign(Object.assign({}, user), { onboarding_complete: Boolean(user === null || user === void 0 ? void 0 : user.onboarding_complete) }),
            dashboard
        });
    }
    catch (error) {
        console.error('Onboarding error:', error);
        res.status(500).json({ error: 'Failed to save onboarding' });
    }
}));
// Profile update route (protected)
app.put('/api/user/profile', authenticateJWT, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        console.log('Profile update request received:', req.body);
        console.log('User ID from JWT:', req.user.userId);
        const { name, email, preferences } = req.body;
        // Validate required fields
        if (!name || !email) {
            console.log('Validation failed: missing name or email');
            return res.status(400).json({ error: 'Name and email are required' });
        }
        console.log('Updating user with data:', { name, email, preferences });
        // Update user profile
        const updateData = { name, email };
        if (preferences) {
            updateData.preferences = preferences;
        }
        yield (0, database_1.updateUser)(req.user.userId, updateData);
        console.log('User updated successfully');
        // Get updated user data
        const user = yield (0, database_1.findUserById)(req.user.userId);
        console.log('Retrieved updated user:', user);
        if (user && user.learning_goals) {
            try {
                user.learning_goals = typeof user.learning_goals === 'string'
                    ? JSON.parse(user.learning_goals)
                    : user.learning_goals;
            }
            catch (e) {
                user.learning_goals = [];
            }
        }
        console.log('Sending response with user:', user);
        res.json({ user });
    }
    catch (error) {
        console.error('Profile update error:', error);
        res.status(500).json({ error: 'Failed to update profile' });
    }
}));
// Language Dashboard APIs
// Get all language dashboards for a user
app.get('/api/user/language-dashboards', authenticateJWT, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const dashboards = yield (0, database_1.getUserLanguageDashboards)(req.user.userId);
        res.json({ dashboards });
    }
    catch (error) {
        console.error('Get language dashboards error:', error);
        res.status(500).json({ error: 'Failed to get language dashboards' });
    }
}));
// Get a specific language dashboard
app.get('/api/user/language-dashboards/:language', authenticateJWT, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { language } = req.params;
        const dashboard = yield (0, database_1.getLanguageDashboard)(req.user.userId, language);
        if (!dashboard) {
            return res.status(404).json({ error: 'Language dashboard not found' });
        }
        res.json({ dashboard });
    }
    catch (error) {
        console.error('Get language dashboard error:', error);
        res.status(500).json({ error: 'Failed to get language dashboard' });
    }
}));
// Create a new language dashboard
app.post('/api/user/language-dashboards', authenticateJWT, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { language, proficiency, talkTopics, learningGoals, practicePreference } = req.body;
        if (!language || !proficiency || !talkTopics || !learningGoals || !practicePreference) {
            return res.status(400).json({ error: 'Missing required fields' });
        }
        // Check if user already has a dashboard for this language
        const existingDashboard = yield (0, database_1.getLanguageDashboard)(req.user.userId, language);
        if (existingDashboard) {
            return res.status(409).json({ error: 'Language dashboard already exists' });
        }
        // Check if this is the user's first dashboard (make it primary)
        const existingDashboards = yield (0, database_1.getUserLanguageDashboards)(req.user.userId);
        const isPrimary = existingDashboards.length === 0;
        const dashboard = yield (0, database_1.createLanguageDashboard)(req.user.userId, language, proficiency, talkTopics, learningGoals, practicePreference, 'en', // feedbackLanguage
        isPrimary // isPrimary as boolean
        );
        res.json({ dashboard });
    }
    catch (error) {
        console.error('Create language dashboard error:', error);
        res.status(500).json({ error: 'Failed to create language dashboard' });
    }
}));
// Update a language dashboard
app.put('/api/user/language-dashboards/:language', authenticateJWT, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { language } = req.params;
        const updates = req.body;
        console.log('[DEBUG] Updating language dashboard for language:', language);
        console.log('[DEBUG] Updates received:', updates);
        console.log('[DEBUG] User ID:', req.user.userId);
        // Check if dashboard exists
        const existingDashboard = yield (0, database_1.getLanguageDashboard)(req.user.userId, language);
        if (!existingDashboard) {
            console.log('[DEBUG] Dashboard not found');
            return res.status(404).json({ error: 'Language dashboard not found' });
        }
        console.log('[DEBUG] Existing dashboard:', existingDashboard);
        yield (0, database_1.updateLanguageDashboard)(req.user.userId, language, updates);
        // Get updated dashboard
        const dashboard = yield (0, database_1.getLanguageDashboard)(req.user.userId, language);
        console.log('[DEBUG] Updated dashboard:', dashboard);
        res.json({ dashboard });
    }
    catch (error) {
        console.error('Update language dashboard error:', error);
        res.status(500).json({ error: 'Failed to update language dashboard' });
    }
}));
// Delete a language dashboard
app.delete('/api/user/language-dashboards/:language', authenticateJWT, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { language } = req.params;
        // Check if dashboard exists
        const existingDashboard = yield (0, database_1.getLanguageDashboard)(req.user.userId, language);
        if (!existingDashboard) {
            return res.status(404).json({ error: 'Language dashboard not found' });
        }
        // Don't allow deletion of primary dashboard if it's the only one
        const allDashboards = yield (0, database_1.getUserLanguageDashboards)(req.user.userId);
        if (existingDashboard.is_primary && allDashboards.length === 1) {
            return res.status(400).json({ error: 'Cannot delete the only language dashboard' });
        }
        yield (0, database_1.deleteLanguageDashboard)(req.user.userId, language);
        res.json({ message: 'Language dashboard deleted successfully' });
    }
    catch (error) {
        console.error('Delete language dashboard error:', error);
        res.status(500).json({ error: 'Failed to delete language dashboard' });
    }
}));
// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        pythonApiUrl: process.env.PYTHON_API_URL || 'http://localhost:5000'
    });
});
// Test TTS endpoint
app.get('/api/test-tts', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const testText = "Hello, this is a test of text to speech.";
        const ttsFileName = `test_tts_${Date.now()}.aiff`;
        const ttsFilePath = path_1.default.join(uploadsDir, ttsFileName);
        const sayCmd = `say -v Alex -o "${ttsFilePath}" "${testText}"`;
        console.log('Test TTS command:', sayCmd);
        yield new Promise((resolve, reject) => {
            (0, child_process_1.exec)(sayCmd, (error) => {
                if (error) {
                    console.error('Test TTS command failed:', error);
                    reject(error);
                }
                else {
                    console.log('Test TTS command completed successfully');
                    resolve();
                }
            });
        });
        if (fs_1.default.existsSync(ttsFilePath)) {
            const stats = fs_1.default.statSync(ttsFilePath);
            console.log('Test TTS file created, size:', stats.size, 'bytes');
            res.json({
                success: true,
                ttsUrl: `/uploads/${ttsFileName}`,
                fileSize: stats.size
            });
        }
        else {
            res.status(500).json({ error: 'Test TTS file was not created' });
        }
    }
    catch (error) {
        console.error('Test TTS error:', error);
        res.status(500).json({ error: 'Test TTS failed', details: error.message });
    }
}));
// Admin: List all users
app.get('/api/admin/users', authenticateJWT, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.user || req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Admin access required' });
        }
        const users = yield (0, database_1.getAllUsers)();
        res.json({ users });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch users' });
    }
}));
// Admin: Promote user to admin
app.post('/api/admin/promote', authenticateJWT, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.user || req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Admin access required' });
        }
        const { email } = req.body;
        if (!email)
            return res.status(400).json({ error: 'Email required' });
        const user = yield (0, database_1.findUserByEmail)(email);
        if (!user)
            return res.status(404).json({ error: 'User not found' });
        yield (0, database_1.updateUser)(user.id, { role: 'admin' });
        res.json({ success: true, message: `${email} promoted to admin.` });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to promote user' });
    }
}));
// Admin: Demote user to regular user
app.post('/api/admin/demote', authenticateJWT, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.user || req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Admin access required' });
        }
        const { email } = req.body;
        if (!email)
            return res.status(400).json({ error: 'Email required' });
        const user = yield (0, database_1.findUserByEmail)(email);
        if (!user)
            return res.status(404).json({ error: 'User not found' });
        yield (0, database_1.updateUser)(user.id, { role: 'user' });
        res.json({ success: true, message: `${email} demoted to user.` });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to demote user' });
    }
}));
// Conversation endpoints
app.post('/api/conversations', authenticateJWT, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { language, title, topics, formality, description, usesPersona, personaId } = req.body;
        console.log('🔄 SERVER: Creating conversation with formality:', formality);
        console.log('🔄 SERVER: Creating conversation with description:', description);
        console.log('🔄 SERVER: Creating conversation with persona info:', { usesPersona, personaId });
        console.log('🔄 SERVER: Full request body:', req.body);
        const conversation = yield (0, database_1.createConversation)(req.user.userId, language, title, topics, formality, description, usesPersona, personaId);
        console.log('🔄 SERVER: Conversation creation result:', conversation);
        if (!conversation || !conversation.id) {
            console.error('❌ SERVER: Failed to create conversation');
            return res.status(500).json({ error: 'Failed to create conversation' });
        }
        // Immediately try to fetch the conversation from the DB
        const verify = yield (0, database_1.getConversationWithMessages)(conversation.id);
        if (!verify) {
            console.error('❌ SERVER: Conversation not found after creation:', conversation.id);
            return res.status(500).json({ error: 'Conversation not found after creation' });
        }
        // Generate and save AI intro message
        let aiMessage = null;
        let aiIntro = 'Hello! What would you like to talk about today?';
        try {
            const user = yield (0, database_1.findUserById)(req.user.userId);
            const userLevel = (user === null || user === void 0 ? void 0 : user.proficiency_level) || 'beginner';
            const userTopics = (user === null || user === void 0 ? void 0 : user.talk_topics) && typeof user.talk_topics === 'string' ? JSON.parse(user.talk_topics) : Array.isArray(user === null || user === void 0 ? void 0 : user.talk_topics) ? user.talk_topics : [];
            const pythonApiUrl = process.env.PYTHON_API_URL || 'http://localhost:5000';
            const topicsToSend = topics && topics.length > 0 ? topics : userTopics;
            try {
                const aiRes = yield axios_1.default.post(`${pythonApiUrl}/initial_message`, {
                    chat_history: [],
                    language,
                    user_level: userLevel,
                    user_topics: topicsToSend,
                    formality: formality || 'friendly',
                    description: description || null
                }, {
                    headers: { 'Content-Type': 'application/json' },
                    timeout: 30000
                });
                console.log('DEBUG: Sending formality to /initial_message:', formality || 'friendly');
                console.log('DEBUG: Received ai_response from Python API:', aiRes.data.ai_response);
                aiIntro = aiRes.data.ai_response && aiRes.data.ai_response.trim() ? aiRes.data.ai_response : 'Hello! What would you like to talk about today?';
            }
            catch (err) {
                console.error('Python API /initial_message error:', err.message);
                aiIntro = 'Hello! What would you like to talk about today?';
            }
            aiMessage = yield (0, database_1.addMessage)(conversation.id, 'AI', aiIntro, 'text', undefined, undefined);
        }
        catch (err) {
            console.error('Error generating/saving AI intro message:', err);
        }
        // Return the actual AI intro text for the frontend
        res.json({ conversation, aiMessage: { text: aiIntro } });
    }
    catch (error) {
        console.error('❌ SERVER: Create conversation error:', error);
        res.status(500).json({ error: 'Failed to create conversation' });
    }
}));
app.get('/api/conversations', authenticateJWT, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const language = req.query.language;
        console.log('🔄 SERVER: Getting conversations for user:', req.user.userId, 'language:', language);
        console.log('🔍 SERVER: Query params:', req.query);
        const conversations = yield (0, database_1.getUserConversations)(req.user.userId, typeof language === 'string' ? language : undefined);
        console.log('✅ SERVER: Found conversations:', conversations.length);
        console.log('📋 SERVER: Conversation details:', conversations.map(c => ({
            id: c.id,
            title: c.title,
            language: 'language' in c ? c.language : undefined
        })));
        res.json({ conversations });
    }
    catch (error) {
        console.error('❌ SERVER: Get conversations error:', error);
        res.status(500).json({ error: 'Failed to get conversations' });
    }
}));
app.get('/api/conversations/:id', authenticateJWT, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        console.log('🔄 SERVER: Getting conversation:', req.params.id);
        const conversation = yield (0, database_1.getConversationWithMessages)(Number(req.params.id));
        if (!conversation) {
            console.log('❌ SERVER: Conversation not found:', req.params.id);
            return res.status(404).json({ error: 'Conversation not found' });
        }
        console.log('✅ SERVER: Conversation loaded with', ((_a = conversation.messages) === null || _a === void 0 ? void 0 : _a.length) || 0, 'messages');
        console.log('📝 SERVER: Conversation details:', {
            id: conversation.id,
            title: conversation.title,
            language: conversation.language,
            formality: conversation.formality,
            messageCount: conversation.message_count,
            messagesLength: ((_b = conversation.messages) === null || _b === void 0 ? void 0 : _b.length) || 0
        });
        if (conversation.messages && conversation.messages.length > 0) {
            console.log('📋 SERVER: Sample messages:', conversation.messages.slice(0, 2));
        }
        res.json({ conversation });
    }
    catch (error) {
        console.error('❌ SERVER: Get conversation error:', error);
        res.status(500).json({ error: 'Failed to get conversation' });
    }
}));
app.post('/api/conversations/:id/messages', authenticateJWT, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        console.log('🔄 SERVER: Adding message to conversation:', req.params.id);
        const { sender, text, messageType, audioFilePath, detailedFeedback, message_order, romanized_text } = req.body;
        console.log('📝 SERVER: Message details:', { sender, text: text.substring(0, 50) + '...', messageType, message_order, romanized_text: romanized_text ? 'present' : 'none' });
        const message = yield (0, database_1.addMessage)(Number(req.params.id), sender, text, messageType, audioFilePath, detailedFeedback, message_order, romanized_text);
        res.json({ message });
    }
    catch (error) {
        console.error('❌ SERVER: Add message error:', error);
        res.status(500).json({ error: 'Failed to add message' });
    }
}));
app.put('/api/conversations/:id/title', authenticateJWT, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { title } = req.body;
        const result = yield (0, database_1.updateConversationTitle)(Number(req.params.id), title);
        res.json({ success: true, changes: result.changes });
    }
    catch (error) {
        console.error('Update conversation title error:', error);
        res.status(500).json({ error: 'Failed to update conversation title' });
    }
}));
app.delete('/api/conversations/:id', authenticateJWT, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const result = yield (0, database_1.deleteConversation)(Number(req.params.id));
        res.json({ success: true, changes: result.changes });
    }
    catch (error) {
        console.error('Delete conversation error:', error);
        res.status(500).json({ error: 'Failed to delete conversation' });
    }
}));
app.patch('/api/conversations/:id', authenticateJWT, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const conversationId = parseInt(req.params.id);
        const { usesPersona, personaId } = req.body;
        // Update conversation with persona information
        yield (0, database_1.updateConversationPersona)(conversationId, usesPersona, personaId);
        res.json({ message: 'Conversation updated successfully' });
    }
    catch (error) {
        console.error('Error updating conversation:', error);
        res.status(500).json({ error: 'Failed to update conversation' });
    }
}));
// Text suggestions endpoint
app.post('/api/suggestions', authenticateJWT, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        console.log('POST /api/suggestions called');
        const { conversationId, language } = req.body;
        // Get user data for personalized suggestions
        const user = yield (0, database_1.findUserById)(req.user.userId);
        const userLevel = req.body.user_level || (user === null || user === void 0 ? void 0 : user.proficiency_level) || 'beginner';
        const userTopics = req.body.user_topics || ((user === null || user === void 0 ? void 0 : user.talk_topics) && typeof user.talk_topics === 'string' ? JSON.parse(user.talk_topics) : Array.isArray(user === null || user === void 0 ? void 0 : user.talk_topics) ? user.talk_topics : []);
        const userGoals = req.body.user_goals || ((user === null || user === void 0 ? void 0 : user.learning_goals) && typeof user.learning_goals === 'string' ? JSON.parse(user.learning_goals) : Array.isArray(user === null || user === void 0 ? void 0 : user.learning_goals) ? user.learning_goals : []);
        let chatHistory = [];
        if (conversationId) {
            // Get conversation history
            const conversation = yield (0, database_1.getConversationWithMessages)(Number(conversationId));
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
            const pythonResponse = yield axios_1.default.post(`${pythonApiUrl}/suggestions`, {
                chat_history: chatHistory,
                language: language || (user === null || user === void 0 ? void 0 : user.target_language) || 'en',
                user_level: userLevel,
                user_topics: userTopics,
                user_goals: userGoals
            }, {
                headers: { 'Content-Type': 'application/json' },
                timeout: 30000
            });
            console.log('Python suggestions received:', pythonResponse.data.suggestions.length);
            res.json({ suggestions: pythonResponse.data.suggestions });
        }
        catch (pythonError) {
            console.error('Python API not available for suggestions:', pythonError.message);
            // Fallback suggestions if Python API fails
            const fallbackSuggestions = [
                { text: "Hello", translation: "Hello", difficulty: "easy" },
                { text: "How are you?", translation: "How are you?", difficulty: "easy" },
                { text: "Thank you", translation: "Thank you", difficulty: "easy" }
            ];
            res.json({ suggestions: fallbackSuggestions });
        }
    }
    catch (error) {
        console.error('Suggestions error:', error);
        res.status(500).json({ error: 'Error getting suggestions', details: error.message });
    }
}));
// Translation endpoint
app.post('/api/translate', authenticateJWT, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
            const pythonResponse = yield axios_1.default.post(`${pythonApiUrl}/translate`, {
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
        }
        catch (pythonError) {
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
    }
    catch (error) {
        console.error('Translation error:', error);
        res.status(500).json({ error: 'Error translating text', details: error.message });
    }
}));
// Explain suggestion endpoint
app.post('/api/explain_suggestion', authenticateJWT, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        console.log('POST /api/explain_suggestion called');
        const { suggestion_text, chatHistory, language, user_level, user_topics, formality, feedback_language, user_goals } = req.body;
        if (!suggestion_text) {
            return res.status(400).json({ error: 'No suggestion text provided' });
        }
        // Call Python API for explanation
        try {
            const pythonApiUrl = process.env.PYTHON_API_URL || 'http://localhost:5000';
            const pythonResponse = yield axios_1.default.post(`${pythonApiUrl}/explain_suggestion`, {
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
        }
        catch (pythonError) {
            console.error('Python API not available for explanation:', pythonError.message);
            // Fallback response if Python API fails
            res.json({
                translation: "Explanation service temporarily unavailable",
                explanation: "The explanation service is currently unavailable. Please try again later.",
                error: "Python API not available"
            });
        }
    }
    catch (error) {
        console.error('Explain suggestion error:', error);
        res.status(500).json({ error: 'Error explaining suggestion', details: error.message });
    }
}));
// Proxy /api/short_feedback to Python API
app.post('/api/short_feedback', authenticateJWT, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        // Get user preferences from request body or fall back to database
        const user = yield (0, database_1.findUserById)(req.user.userId);
        const userLevel = req.body.user_level || (user === null || user === void 0 ? void 0 : user.proficiency_level) || 'beginner';
        const userTopics = req.body.user_topics || ((user === null || user === void 0 ? void 0 : user.talk_topics) && typeof user.talk_topics === 'string' ? JSON.parse(user.talk_topics) : Array.isArray(user === null || user === void 0 ? void 0 : user.talk_topics) ? user.talk_topics : []);
        const userGoals = req.body.user_goals || ((user === null || user === void 0 ? void 0 : user.learning_goals) && typeof user.learning_goals === 'string' ? JSON.parse(user.learning_goals) : Array.isArray(user === null || user === void 0 ? void 0 : user.learning_goals) ? user.learning_goals : []);
        const feedbackLanguage = req.body.feedback_language || 'en';
        const pythonApiUrl = process.env.PYTHON_API_URL || 'http://localhost:5000';
        const response = yield axios_1.default.post(`${pythonApiUrl}/short_feedback`, Object.assign(Object.assign({}, req.body), { user_level: userLevel, user_topics: userTopics, user_goals: userGoals }), {
            headers: { 'Content-Type': 'application/json' },
            timeout: 30000
        });
        res.status(response.status).json(response.data);
    }
    catch (error) {
        res.status(((_a = error.response) === null || _a === void 0 ? void 0 : _a.status) || 500).json(((_b = error.response) === null || _b === void 0 ? void 0 : _b.data) || { error: error.message });
    }
}));
// Proxy /api/detailed_breakdown to Python API
app.post('/api/detailed_breakdown', authenticateJWT, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        // Get user preferences from request body or fall back to database
        const user = yield (0, database_1.findUserById)(req.user.userId);
        const userLevel = req.body.user_level || (user === null || user === void 0 ? void 0 : user.proficiency_level) || 'beginner';
        const userTopics = req.body.user_topics || ((user === null || user === void 0 ? void 0 : user.talk_topics) && typeof user.talk_topics === 'string' ? JSON.parse(user.talk_topics) : Array.isArray(user === null || user === void 0 ? void 0 : user.talk_topics) ? user.talk_topics : []);
        const userGoals = req.body.user_goals || ((user === null || user === void 0 ? void 0 : user.learning_goals) && typeof user.learning_goals === 'string' ? JSON.parse(user.learning_goals) : Array.isArray(user === null || user === void 0 ? void 0 : user.learning_goals) ? user.learning_goals : []);
        const formality = req.body.formality || 'friendly';
        const feedbackLanguage = req.body.feedback_language || 'en';
        const pythonApiUrl = process.env.PYTHON_API_URL || 'http://localhost:5000';
        const response = yield axios_1.default.post(`${pythonApiUrl}/detailed_breakdown`, Object.assign(Object.assign({}, req.body), { user_level: userLevel, user_topics: userTopics, user_goals: userGoals, formality: formality, feedback_language: feedbackLanguage }), {
            headers: { 'Content-Type': 'application/json' },
            timeout: 30000
        });
        res.json(response.data);
    }
    catch (error) {
        console.error('Detailed breakdown error:', error);
        res.status(500).json({
            error: 'Failed to get detailed breakdown',
            details: ((_a = error.response) === null || _a === void 0 ? void 0 : _a.data) || error.message
        });
    }
}));
// Personas endpoints
app.post('/api/personas', authenticateJWT, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { name, description, topics, formality, language, conversationId } = req.body;
        const userId = req.user.userId;
        if (!name) {
            return res.status(400).json({ error: 'Name is required' });
        }
        const persona = yield (0, database_1.createPersona)(userId, {
            name,
            description: description || '',
            topics: topics || [],
            formality: formality || 'neutral',
            language: language || 'en',
            conversationId: conversationId
        });
        res.status(201).json({ persona });
    }
    catch (error) {
        console.error('Error creating persona:', error);
        res.status(500).json({ error: 'Failed to create persona', details: error.message });
    }
}));
app.get('/api/personas', authenticateJWT, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.user.userId;
        const personas = yield (0, database_1.getUserPersonas)(userId);
        res.json({ personas });
    }
    catch (error) {
        console.error('Error fetching personas:', error);
        res.status(500).json({ error: 'Failed to fetch personas', details: error.message });
    }
}));
app.delete('/api/personas/:id', authenticateJWT, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const personaId = parseInt(req.params.id);
        const result = yield (0, database_1.deletePersona)(personaId);
        if (result.changes === 0) {
            return res.status(404).json({ error: 'Persona not found' });
        }
        res.json({ message: 'Persona deleted successfully' });
    }
    catch (error) {
        console.error('Error deleting persona:', error);
        res.status(500).json({ error: 'Failed to delete persona', details: error.message });
    }
}));
// Serve uploads directory statically for TTS audio
app.use('/uploads', express_1.default.static(path_1.default.join(__dirname, 'uploads')));
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Python API URL: ${process.env.PYTHON_API_URL || 'http://localhost:5000'}`);
    console.log('Note: Using SQLite database for temporary storage');
});
