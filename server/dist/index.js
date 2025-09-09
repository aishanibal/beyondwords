"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require('dotenv').config();
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const multer_1 = __importDefault(require("multer"));
const supabase_db_1 = require("./supabase-db");
const google_auth_library_1 = require("google-auth-library");
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const child_process_1 = require("child_process");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const axios_1 = __importDefault(require("axios"));
const JWT_SECRET = process.env.JWT_SECRET || 'your_super_secret_key';
const googleClient = new google_auth_library_1.OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const globalAny = global;
const app = (0, express_1.default)();
app.use((req, res, next) => {
    console.log('INCOMING REQUEST:', req.method, req.url, 'Headers:', req.headers);
    next();
});
app.use(express_1.default.json());
app.use((0, cors_1.default)({
    origin: [
        'http://localhost:3000',
        'https://speakbeyondwords-sigma.vercel.app'
    ],
    credentials: false
}));
const storage = multer_1.default.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadsDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + '.wav');
    }
});
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
        fileSize: 10 * 1024 * 1024
    }
});
function authenticateJWT(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader)
        return res.status(401).json({ error: 'No token provided' });
    const token = authHeader.split(' ')[1];
    jsonwebtoken_1.default.verify(token, JWT_SECRET, async (err, user) => {
        if (!err && user) {
            req.user = user;
            return next();
        }
        try {
            const decoded = jsonwebtoken_1.default.decode(token);
            if (decoded && decoded.sub && decoded.email) {
                req.user = {
                    userId: decoded.sub,
                    email: decoded.email,
                    name: decoded.user_metadata?.name || decoded.user_metadata?.full_name || 'User'
                };
                return next();
            }
        }
        catch (supabaseErr) {
            console.error('Supabase token validation failed:', supabaseErr);
        }
        return res.status(403).json({ error: 'Invalid token' });
    });
}
app.get('/api/user', authenticateJWT, async (req, res) => {
    try {
        let user = await (0, supabase_db_1.findUserById)(req.user.userId);
        if (!user) {
            user = await (0, supabase_db_1.createUser)({
                email: req.user.email || '',
                name: req.user.name || '',
                role: 'user',
                onboarding_complete: false
            });
        }
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
        const userResponse = {
            ...user,
            onboarding_complete: Boolean(user.onboarding_complete)
        };
        res.json({ user: userResponse });
    }
    catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});
app.get('/api/logout', (req, res) => {
    res.json({ message: 'Logged out' });
});
app.get('/api/user/streak', async (req, res) => {
    console.log('[STREAK DEBUG] /api/user/streak called', { userId: req.user?.id || req.query.userId, language: req.query.language });
    let userId = req.user?.id;
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
        const result = await (0, supabase_db_1.getUserStreak)(userId, language);
        res.json(result);
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
app.post('/api/analyze', authenticateJWT, upload.single('audio'), async (req, res) => {
    try {
        console.log('POST /api/analyze called');
        console.log('req.file:', req.file);
        if (!req.file) {
            console.error('No audio file provided');
            return res.status(400).json({ error: 'No audio file provided' });
        }
        const audioFilePath = req.file.path;
        console.log('Audio file saved at:', audioFilePath);
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
        globalAny.lastChatHistory = chatHistory;
        const user = await (0, supabase_db_1.findUserById)(req.user.userId);
        const userLevel = req.body.user_level || user?.proficiency_level || 'beginner';
        const userTopics = req.body.user_topics ? JSON.parse(req.body.user_topics) : (user?.talk_topics && typeof user.talk_topics === 'string' ? JSON.parse(user.talk_topics) : Array.isArray(user?.talk_topics) ? user.talk_topics : []);
        const userGoals = req.body.user_goals ? JSON.parse(req.body.user_goals) : (user?.learning_goals && typeof user.learning_goals === 'string' ? JSON.parse(user.learning_goals) : Array.isArray(user?.learning_goals) ? user.learning_goals : []);
        const formality = req.body.formality || 'friendly';
        const feedbackLanguage = req.body.feedback_language || 'en';
        console.log('🔄 SERVER: /api/analyze received formality:', formality);
        console.log('🔄 SERVER: /api/analyze received user_goals:', userGoals);
        console.log('🔄 SERVER: /api/analyze form data:', req.body);
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
            if (!fs_1.default.existsSync(audioFilePath)) {
                throw new Error(`Audio file does not exist: ${audioFilePath}`);
            }
            const fileStats = fs_1.default.statSync(audioFilePath);
            console.log('Audio file size:', fileStats.size, 'bytes');
            const transcriptionResponse = await axios_1.default.post(`${pythonApiUrl}/transcribe`, {
                audio_file: audioFilePath,
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
        }
        catch (transcriptionError) {
            console.error('=== PYTHON API FAILED ===');
            console.error('Python API call failed:', transcriptionError.message);
            console.error('Error details:', transcriptionError.response?.data || transcriptionError.code || 'No additional details');
            console.log('Falling back to basic transcription and response');
            pythonApiAvailable = false;
        }
        let ttsUrl = null;
        const language = req.body.language || 'en';
        try {
            const ttsFileName = `tts_${Date.now()}.aiff`;
            const ttsFilePath = path_1.default.join(uploadsDir, ttsFileName);
            console.log('Generating TTS using Gemini API for language:', language);
            console.log('TTS text length:', aiResponse.length);
            const pythonApiUrl = (process.env.PYTHON_API_URL || 'https://beyondwords.onrender.com').replace(/\/$/, '');
            const ttsResponse = await axios_1.default.post(`${pythonApiUrl}/generate_tts`, {
                text: aiResponse,
                language_code: language,
                output_path: ttsFilePath
            }, {
                headers: { 'Content-Type': 'application/json' },
                timeout: 30000
            });
            if (ttsResponse.data.success && ttsResponse.data.output_path) {
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
            else {
                console.error('TTS generation failed:', ttsResponse.data.error);
                ttsUrl = null;
            }
        }
        catch (ttsError) {
            console.error('TTS error:', ttsError);
            ttsUrl = null;
        }
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
app.post('/api/feedback', authenticateJWT, async (req, res) => {
    try {
        console.log('POST /api/feedback called');
        console.log('Request body:', req.body);
        const { user_input, context, language, user_level, user_topics, romanization_display } = req.body;
        if (!user_input || !context) {
            console.log('Missing required fields:', { user_input: !!user_input, context: !!context });
            return res.status(400).json({ error: 'Missing user_input or context' });
        }
        console.log('Parsed parameters:', { user_input, context: context.substring(0, 100) + '...', language, user_level, user_topics });
        const chat_history = context
            .split('\n')
            .map((line) => {
            const [sender, ...rest] = line.split(':');
            return { sender: sender.trim(), text: rest.join(':').trim() };
        });
        console.log('Parsed chat_history:', chat_history);
        let feedback = '';
        try {
            const pythonApiUrl = (process.env.PYTHON_API_URL || 'https://beyondwords.onrender.com').replace(/\/$/, '');
            const pythonResponse = await axios_1.default.post(`${pythonApiUrl}/feedback`, {
                chat_history,
                recognized_text: user_input,
                language,
                user_level,
                user_topics,
                feedback_language: 'en',
                romanization_display
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
});
app.post('/api/messages/:messageId/feedback', authenticateJWT, async (req, res) => {
    try {
        const { messageId } = req.params;
        const { feedback } = req.body;
        if (!feedback) {
            return res.status(400).json({ error: 'No feedback provided' });
        }
        console.log('Storing detailed feedback for message:', messageId);
        const updateSql = `
      UPDATE messages 
      SET detailed_feedback = ? 
      WHERE id = ?
    `;
        await new Promise((resolve, reject) => {
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
});
app.post('/api/save-session', async (req, res) => {
    try {
        const { userId, chatHistory, language = 'en' } = req.body;
        if (!userId) {
            return res.status(401).json({ error: 'User ID required' });
        }
        if (!chatHistory || !Array.isArray(chatHistory) || chatHistory.length === 0) {
            return res.status(400).json({ error: 'No chat history provided' });
        }
        const session = await (0, supabase_db_1.saveSession)(userId, chatHistory, language);
        res.json({ success: true, sessionId: session.id });
    }
    catch (error) {
        console.error('Save session error:', error);
        res.status(500).json({ error: 'Failed to save session', details: error.message });
    }
});
app.get('/api/sessions/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const sessions = await (0, supabase_db_1.getAllSessions)(userId);
        res.json({ sessions });
    }
    catch (error) {
        console.error('Get sessions error:', error);
        res.status(500).json({ error: 'Failed to get sessions' });
    }
});
app.get('/api/sessions/:userId/latest', async (req, res) => {
    try {
        const { userId } = req.params;
        const session = await (0, supabase_db_1.getSession)(userId);
        res.json({ session });
    }
    catch (error) {
        console.error('Get latest session error:', error);
        res.status(500).json({ error: 'Failed to get latest session' });
    }
});
app.post('/auth/google/token', async (req, res) => {
    try {
        const { credential } = req.body;
        const ticket = await googleClient.verifyIdToken({
            idToken: credential,
            audience: process.env.GOOGLE_CLIENT_ID
        });
        const payload = ticket.getPayload();
        const { sub: googleId, email, name } = payload || { sub: '', email: '', name: '' };
        let user = await (0, supabase_db_1.findUserByGoogleId)(googleId);
        if (!user) {
            user = await (0, supabase_db_1.createUser)({
                googleId,
                email,
                name,
                role: 'user',
                onboarding_complete: false
            });
        }
        const token = jsonwebtoken_1.default.sign({ userId: user.id, email: user.email, name: user.name }, JWT_SECRET, { expiresIn: '7d' });
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
    }
    catch (error) {
        console.error('Google auth error:', error);
        res.status(400).json({ error: 'Invalid credential' });
    }
});
app.post('/auth/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;
        const existingUser = await (0, supabase_db_1.findUserByEmail)(email);
        if (existingUser) {
            return res.status(400).json({ error: 'User already exists' });
        }
        const passwordHash = await bcryptjs_1.default.hash(password, 10);
        const user = await (0, supabase_db_1.createUser)({
            email,
            name,
            password_hash: passwordHash,
            role: 'user',
            onboarding_complete: false
        });
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
});
app.post('/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await (0, supabase_db_1.findUserByEmail)(email);
        if (!user)
            return res.status(401).json({ error: 'Invalid credentials' });
        if (!user.password_hash) {
            return res.status(401).json({ error: 'This email is associated with a Google account. Please sign in with Google.' });
        }
        const isValid = await bcryptjs_1.default.compare(password, user.password_hash);
        if (!isValid)
            return res.status(401).json({ error: 'Invalid credentials' });
        const token = jsonwebtoken_1.default.sign({ userId: user.id, email: user.email, name: user.name }, JWT_SECRET, { expiresIn: '7d' });
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
});
app.post('/api/user/onboarding', authenticateJWT, async (req, res) => {
    try {
        console.log('Onboarding request received:', req.body);
        console.log('User from token:', req.user);
        const { language, proficiency, talkTopics, learningGoals, practicePreference } = req.body;
        console.log('Extracted fields:', { language, proficiency, talkTopics, learningGoals, practicePreference });
        if (!language || !proficiency || !talkTopics || !learningGoals || !practicePreference) {
            console.log('Missing required fields validation failed');
            return res.status(400).json({ error: 'Missing required onboarding fields' });
        }
        let user = await (0, supabase_db_1.findUserById)(req.user.userId);
        if (!user) {
            console.log('User not found in database, creating new user record');
            user = await (0, supabase_db_1.createUser)({
                id: req.user.userId,
                email: req.user.email || '',
                name: req.user.name || '',
                role: 'user',
                onboarding_complete: false
            });
            console.log('Created user record:', user);
        }
        console.log('Creating language dashboard for user:', req.user.userId);
        const dashboard = await (0, supabase_db_1.createLanguageDashboard)(req.user.userId, language, proficiency, talkTopics, learningGoals, practicePreference, 'en', true);
        console.log('Created dashboard:', dashboard);
        console.log('Updating user onboarding status');
        await (0, supabase_db_1.updateUser)(req.user.userId, {
            onboarding_complete: true
        });
        const updatedUser = await (0, supabase_db_1.findUserById)(req.user.userId);
        console.log('Updated user:', updatedUser);
        res.json({
            user: {
                ...updatedUser,
                onboarding_complete: Boolean(updatedUser?.onboarding_complete)
            },
            dashboard
        });
    }
    catch (error) {
        console.error('Onboarding error:', error);
        console.error('Error stack:', error.stack);
        res.status(500).json({ error: 'Failed to save onboarding', details: error.message });
    }
});
app.put('/api/user/profile', authenticateJWT, async (req, res) => {
    try {
        console.log('Profile update request received:', req.body);
        console.log('User ID from JWT:', req.user.userId);
        console.log('Request headers:', req.headers);
        const { name, email, preferences } = req.body;
        console.log('Extracted data:', { name, email, preferences });
        if (!name || !email) {
            console.log('Validation failed: missing name or email');
            console.log('Name value:', name, 'Email value:', email);
            return res.status(400).json({ error: 'Name and email are required' });
        }
        console.log('Updating user with data:', { name, email, preferences });
        const updateData = { name, email };
        if (preferences) {
            updateData.preferences = preferences;
        }
        await (0, supabase_db_1.updateUser)(req.user.userId, updateData);
        console.log('User updated successfully');
        const user = await (0, supabase_db_1.findUserById)(req.user.userId);
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
});
app.get('/api/user/language-dashboards', authenticateJWT, async (req, res) => {
    try {
        const dashboards = await (0, supabase_db_1.getUserLanguageDashboards)(req.user.userId);
        res.json({ dashboards });
    }
    catch (error) {
        console.error('Get language dashboards error:', error);
        res.status(500).json({ error: 'Failed to get language dashboards' });
    }
});
app.get('/api/user/language-dashboards/:language', authenticateJWT, async (req, res) => {
    try {
        const { language } = req.params;
        const dashboard = await (0, supabase_db_1.getLanguageDashboard)(req.user.userId, language);
        if (!dashboard) {
            return res.status(404).json({ error: 'Language dashboard not found' });
        }
        res.json({ dashboard });
    }
    catch (error) {
        console.error('Get language dashboard error:', error);
        res.status(500).json({ error: 'Failed to get language dashboard' });
    }
});
app.post('/api/user/language-dashboards', authenticateJWT, async (req, res) => {
    try {
        const { language, proficiency, talkTopics, learningGoals, practicePreference } = req.body;
        if (!language || !proficiency || !talkTopics || !learningGoals || !practicePreference) {
            return res.status(400).json({ error: 'Missing required fields' });
        }
        const existingDashboard = await (0, supabase_db_1.getLanguageDashboard)(req.user.userId, language);
        if (existingDashboard) {
            return res.status(409).json({ error: 'Language dashboard already exists' });
        }
        const existingDashboards = await (0, supabase_db_1.getUserLanguageDashboards)(req.user.userId);
        const isPrimary = existingDashboards.length === 0;
        const dashboard = await (0, supabase_db_1.createLanguageDashboard)(req.user.userId, language, proficiency, talkTopics, learningGoals, practicePreference, 'en', isPrimary);
        res.json({ dashboard });
    }
    catch (error) {
        console.error('Create language dashboard error:', error);
        res.status(500).json({ error: 'Failed to create language dashboard' });
    }
});
app.put('/api/user/language-dashboards/:language', authenticateJWT, async (req, res) => {
    try {
        const { language } = req.params;
        const updates = req.body;
        console.log('[DEBUG] Updating language dashboard for language:', language);
        console.log('[DEBUG] Updates received:', updates);
        console.log('[DEBUG] User ID:', req.user.userId);
        const existingDashboard = await (0, supabase_db_1.getLanguageDashboard)(req.user.userId, language);
        if (!existingDashboard) {
            console.log('[DEBUG] Dashboard not found');
            return res.status(404).json({ error: 'Language dashboard not found' });
        }
        console.log('[DEBUG] Existing dashboard:', existingDashboard);
        await (0, supabase_db_1.updateLanguageDashboard)(req.user.userId, language, updates);
        const dashboard = await (0, supabase_db_1.getLanguageDashboard)(req.user.userId, language);
        console.log('[DEBUG] Updated dashboard:', dashboard);
        res.json({ dashboard });
    }
    catch (error) {
        console.error('Update language dashboard error:', error);
        res.status(500).json({ error: 'Failed to update language dashboard' });
    }
});
app.delete('/api/user/language-dashboards/:language', authenticateJWT, async (req, res) => {
    try {
        const { language } = req.params;
        const existingDashboard = await (0, supabase_db_1.getLanguageDashboard)(req.user.userId, language);
        if (!existingDashboard) {
            return res.status(404).json({ error: 'Language dashboard not found' });
        }
        const allDashboards = await (0, supabase_db_1.getUserLanguageDashboards)(req.user.userId);
        if (existingDashboard.is_primary && allDashboards.length === 1) {
            return res.status(400).json({ error: 'Cannot delete the only language dashboard' });
        }
        await (0, supabase_db_1.deleteLanguageDashboard)(req.user.userId, language);
        res.json({ message: 'Language dashboard deleted successfully' });
    }
    catch (error) {
        console.error('Delete language dashboard error:', error);
        res.status(500).json({ error: 'Failed to delete language dashboard' });
    }
});
app.get('/api/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        pythonApiUrl: process.env.PYTHON_API_URL || 'http://localhost:5000'
    });
});
app.get('/api/test-tts', async (req, res) => {
    try {
        const testText = "Hello, this is a test of text to speech.";
        const ttsFileName = `test_tts_${Date.now()}.aiff`;
        const ttsFilePath = path_1.default.join(uploadsDir, ttsFileName);
        const sayCmd = `say -v Alex -o "${ttsFilePath}" "${testText}"`;
        console.log('Test TTS command:', sayCmd);
        await new Promise((resolve, reject) => {
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
});
app.get('/api/admin/users', authenticateJWT, async (req, res) => {
    try {
        if (!req.user || req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Admin access required' });
        }
        const users = await (0, supabase_db_1.getAllUsers)();
        res.json({ users });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});
app.post('/api/admin/promote', authenticateJWT, async (req, res) => {
    try {
        if (!req.user || req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Admin access required' });
        }
        const { email } = req.body;
        if (!email)
            return res.status(400).json({ error: 'Email required' });
        const user = await (0, supabase_db_1.findUserByEmail)(email);
        if (!user)
            return res.status(404).json({ error: 'User not found' });
        await (0, supabase_db_1.updateUser)(user.id, { role: 'admin' });
        res.json({ success: true, message: `${email} promoted to admin.` });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to promote user' });
    }
});
app.post('/api/admin/demote', authenticateJWT, async (req, res) => {
    try {
        if (!req.user || req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Admin access required' });
        }
        const { email } = req.body;
        if (!email)
            return res.status(400).json({ error: 'Email required' });
        const user = await (0, supabase_db_1.findUserByEmail)(email);
        if (!user)
            return res.status(404).json({ error: 'User not found' });
        await (0, supabase_db_1.updateUser)(user.id, { role: 'user' });
        res.json({ success: true, message: `${email} demoted to user.` });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to demote user' });
    }
});
app.post('/api/conversations', authenticateJWT, async (req, res) => {
    try {
        const { language, title, topics, formality, description, usesPersona, personaId, learningGoals } = req.body;
        console.log('🔄 SERVER: Creating conversation with formality:', formality);
        console.log('🔄 SERVER: Creating conversation with description:', description);
        console.log('🔄 SERVER: Creating conversation with persona info:', { usesPersona, personaId });
        console.log('🔄 SERVER: Creating conversation with learning goals:', learningGoals);
        console.log('🔄 SERVER: Full request body:', req.body);
        if (!req.user?.userId) {
            return res.status(401).json({ error: 'AUTH_ERROR: Missing or invalid user' });
        }
        if (!language || !title || !Array.isArray(topics) || topics.length === 0) {
            return res.status(400).json({ error: 'VALIDATION_ERROR: Missing required fields (language, title, topics[])' });
        }
        let languageDashboardId = null;
        try {
            const dashboard = await (0, supabase_db_1.getLanguageDashboard)(req.user.userId, language);
            languageDashboardId = dashboard?.id ?? null;
        }
        catch (e) {
            console.log('⚠️ SERVER: Could not find language dashboard for language:', language);
            languageDashboardId = null;
        }
        const conversation = await (0, supabase_db_1.createConversation)(req.user.userId, languageDashboardId, title, topics, formality, description, usesPersona, personaId, learningGoals);
        console.log('🔄 SERVER: Conversation creation result:', conversation);
        if (!conversation || !conversation.id) {
            console.error('❌ SERVER: Failed to create conversation (no id)');
            return res.status(500).json({ error: 'DB_ERROR: Conversation create returned no id' });
        }
        const verify = await (0, supabase_db_1.getConversationWithMessages)(conversation.id);
        if (!verify) {
            console.error('❌ SERVER: Conversation not found after creation:', conversation.id);
            return res.status(500).json({ error: 'VERIFY_ERROR: Conversation not found after creation' });
        }
        let aiMessage = null;
        let aiIntro = 'Hello! What would you like to talk about today?';
        let ttsUrl = null;
        try {
            const user = await (0, supabase_db_1.findUserById)(req.user.userId);
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
                const aiRes = await axios_1.default.post(`${pythonApiUrl}/initial_message`, requestPayload, {
                    headers: { 'Content-Type': 'application/json' },
                    timeout: 30000
                });
                console.log('🐍 [PYTHON DEBUG] /initial_message response status:', aiRes.status);
                console.log('🐍 [PYTHON DEBUG] /initial_message response headers:', aiRes.headers);
                console.log('🐍 [PYTHON DEBUG] /initial_message response data:', JSON.stringify(aiRes.data, null, 2));
                if (aiRes.data && aiRes.data.message) {
                    aiIntro = aiRes.data.message.trim() || 'Hello! What would you like to talk about today?';
                    console.log('🐍 [PYTHON DEBUG] Using AI message:', aiIntro);
                }
                else {
                    console.log('🐍 [PYTHON DEBUG] No message in response, using fallback');
                    aiIntro = 'Hello! What would you like to talk about today?';
                }
            }
            catch (err) {
                console.error('🐍 [PYTHON DEBUG] /initial_message error details:');
                console.error('🐍 [PYTHON DEBUG] Error message:', err.message);
                console.error('🐍 [PYTHON DEBUG] Error code:', err.code);
                console.error('🐍 [PYTHON DEBUG] Error status:', err.response?.status);
                console.error('🐍 [PYTHON DEBUG] Error response data:', err.response?.data);
                console.error('🐍 [PYTHON DEBUG] Error response headers:', err.response?.headers);
                console.error('🐍 [PYTHON DEBUG] Full error object:', err);
                if (err.response?.status === 429) {
                    console.log('🐍 [PYTHON DEBUG] Rate limit hit - using fallback message');
                }
                else if (err.response?.status === 401) {
                    console.log('🐍 [PYTHON DEBUG] Authentication error - check API keys');
                }
                else if (err.response?.status === 500) {
                    console.log('🐍 [PYTHON DEBUG] Python API internal error');
                }
                aiIntro = 'Hello! What would you like to talk about today?';
            }
            if (aiIntro && aiIntro.trim()) {
                ttsUrl = await generateTTS(aiIntro, language);
                console.log('Generated TTS for initial message:', ttsUrl);
            }
            aiMessage = await (0, supabase_db_1.addMessage)(conversation.id, 'AI', aiIntro, 'text', undefined, undefined, 1);
        }
        catch (err) {
            console.error('Error generating/saving AI intro message:', err);
        }
        res.json({ conversation, aiMessage: { text: aiIntro, ttsUrl } });
    }
    catch (error) {
        console.error('❌ SERVER: Create conversation error:', error);
        const message = typeof error?.message === 'string' ? error.message : 'Unknown error';
        res.status(500).json({ error: `CREATE_ERROR: ${message}` });
    }
});
app.get('/api/conversations', authenticateJWT, async (req, res) => {
    try {
        const language = req.query.language;
        console.log('🔄 SERVER: Getting conversations for user:', req.user.userId, 'language:', language);
        console.log('🔍 SERVER: Query params:', req.query);
        const conversations = await (0, supabase_db_1.getUserConversations)(req.user.userId, typeof language === 'string' ? language : undefined);
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
});
app.get('/api/conversations/:id', authenticateJWT, async (req, res) => {
    try {
        console.log('🔄 SERVER: Getting conversation:', req.params.id);
        const conversation = await (0, supabase_db_1.getConversationWithMessages)(Number(req.params.id));
        if (!conversation) {
            console.log('❌ SERVER: Conversation not found:', req.params.id);
            return res.status(404).json({ error: 'Conversation not found' });
        }
        console.log('✅ SERVER: Conversation loaded with', conversation.messages?.length || 0, 'messages');
        console.log('📝 SERVER: Conversation details:', {
            id: conversation.id,
            title: conversation.title,
            language: conversation.language,
            formality: conversation.formality,
            messageCount: conversation.message_count,
            messagesLength: conversation.messages?.length || 0
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
});
app.post('/api/conversations/:id/messages', authenticateJWT, async (req, res) => {
    try {
        console.log('🔄 SERVER: Adding message to conversation:', req.params.id);
        const { sender, text, messageType, audioFilePath, detailedFeedback, message_order, romanized_text } = req.body;
        console.log('📝 SERVER: Message details:', { sender, text: text.substring(0, 50) + '...', messageType, message_order, romanized_text: romanized_text ? 'present' : 'none' });
        const message = await (0, supabase_db_1.addMessage)(Number(req.params.id), sender, text, messageType, audioFilePath, detailedFeedback, message_order, romanized_text);
        res.json({ message });
    }
    catch (error) {
        console.error('❌ SERVER: Add message error:', error);
        res.status(500).json({ error: 'Failed to add message' });
    }
});
app.put('/api/conversations/:id/title', authenticateJWT, async (req, res) => {
    try {
        const { title } = req.body;
        const result = await (0, supabase_db_1.updateConversationTitle)(Number(req.params.id), title);
        res.json({ success: true, changes: result.changes });
    }
    catch (error) {
        console.error('Update conversation title error:', error);
        res.status(500).json({ error: 'Failed to update conversation title' });
    }
});
app.delete('/api/conversations/:id', authenticateJWT, async (req, res) => {
    try {
        const result = await (0, supabase_db_1.deleteConversation)(Number(req.params.id));
        res.json({ success: true, changes: result.changes });
    }
    catch (error) {
        console.error('Delete conversation error:', error);
        res.status(500).json({ error: 'Failed to delete conversation' });
    }
});
app.patch('/api/conversations/:id', authenticateJWT, async (req, res) => {
    try {
        const conversationId = parseInt(req.params.id);
        const { usesPersona, personaId, synopsis, progress_data } = req.body;
        if (synopsis !== undefined) {
            console.log('Updating conversation synopsis and progress:', { conversationId, synopsis: synopsis.substring(0, 100) + '...', progress_data });
            await (0, supabase_db_1.updateConversationSynopsis)(conversationId, synopsis, progress_data);
            console.log('Conversation synopsis and progress updated successfully');
            res.json({ message: 'Conversation synopsis and progress updated successfully' });
        }
        else if (usesPersona !== undefined) {
            await (0, supabase_db_1.updateConversationPersona)(conversationId, usesPersona, personaId);
            res.json({ message: 'Conversation updated successfully' });
        }
        else {
            res.status(400).json({ error: 'No valid update fields provided' });
        }
    }
    catch (error) {
        console.error('Error updating conversation:', error);
        res.status(500).json({ error: 'Failed to update conversation' });
    }
});
app.post('/api/suggestions', authenticateJWT, async (req, res) => {
    try {
        console.log('POST /api/suggestions called');
        const { conversationId, language } = req.body;
        const user = await (0, supabase_db_1.findUserById)(req.user.userId);
        const userLevel = req.body.user_level || user?.proficiency_level || 'beginner';
        const userTopics = req.body.user_topics || (user?.talk_topics && typeof user.talk_topics === 'string' ? JSON.parse(user.talk_topics) : Array.isArray(user?.talk_topics) ? user.talk_topics : []);
        const userGoals = req.body.user_goals || (user?.learning_goals && typeof user.learning_goals === 'string' ? JSON.parse(user.learning_goals) : Array.isArray(user?.learning_goals) ? user.learning_goals : []);
        let chatHistory = [];
        if (conversationId) {
            const conversation = await (0, supabase_db_1.getConversationWithMessages)(Number(conversationId));
            if (conversation) {
                chatHistory = (conversation.messages || []).map(msg => ({
                    sender: msg.sender,
                    text: msg.text,
                    timestamp: msg.created_at
                }));
            }
        }
        try {
            const pythonApiUrl = (process.env.PYTHON_API_URL || 'https://beyondwords.onrender.com').replace(/\/$/, '');
            const pythonResponse = await axios_1.default.post(`${pythonApiUrl}/suggestions`, {
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
        }
        catch (pythonError) {
            console.error('Python API not available for suggestions:', pythonError.message);
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
});
app.post('/api/translate', authenticateJWT, async (req, res) => {
    try {
        console.log('POST /api/translate called');
        const { text, source_language, target_language, breakdown } = req.body;
        if (!text) {
            return res.status(400).json({ error: 'No text provided' });
        }
        const finalTargetLanguage = target_language || 'en';
        try {
            const pythonApiUrl = (process.env.PYTHON_API_URL || 'https://beyondwords.onrender.com').replace(/\/$/, '');
            const pythonResponse = await axios_1.default.post(`${pythonApiUrl}/translate`, {
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
});
app.post('/api/explain_suggestion', authenticateJWT, async (req, res) => {
    try {
        console.log('POST /api/explain_suggestion called');
        const { suggestion_text, chatHistory, language, user_level, user_topics, formality, feedback_language, user_goals } = req.body;
        if (!suggestion_text) {
            return res.status(400).json({ error: 'No suggestion text provided' });
        }
        try {
            const pythonApiUrl = (process.env.PYTHON_API_URL || 'https://beyondwords.onrender.com').replace(/\/$/, '');
            const pythonResponse = await axios_1.default.post(`${pythonApiUrl}/explain_suggestion`, {
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
});
app.post('/api/short_feedback', authenticateJWT, async (req, res) => {
    try {
        const user = await (0, supabase_db_1.findUserById)(req.user.userId);
        const userLevel = req.body.user_level || user?.proficiency_level || 'beginner';
        const userTopics = req.body.user_topics || (user?.talk_topics && typeof user.talk_topics === 'string' ? JSON.parse(user.talk_topics) : Array.isArray(user?.talk_topics) ? user.talk_topics : []);
        const userGoals = req.body.user_goals || (user?.learning_goals && typeof user.learning_goals === 'string' ? JSON.parse(user.learning_goals) : Array.isArray(user?.learning_goals) ? user.learning_goals : []);
        const feedbackLanguage = req.body.feedback_language || 'en';
        const pythonApiUrl = process.env.PYTHON_API_URL || 'https://beyondwords.onrender.com';
        const response = await axios_1.default.post(`${pythonApiUrl}/short_feedback`, {
            ...req.body,
            user_level: userLevel,
            user_topics: userTopics,
            user_goals: userGoals
        }, {
            headers: { 'Content-Type': 'application/json' },
            timeout: 30000
        });
        res.status(response.status).json(response.data);
    }
    catch (error) {
        res.status(error.response?.status || 500).json(error.response?.data || { error: error.message });
    }
});
app.post('/api/detailed_breakdown', authenticateJWT, async (req, res) => {
    try {
        const user = await (0, supabase_db_1.findUserById)(req.user.userId);
        const userLevel = req.body.user_level || user?.proficiency_level || 'beginner';
        const userTopics = req.body.user_topics || (user?.talk_topics && typeof user.talk_topics === 'string' ? JSON.parse(user.talk_topics) : Array.isArray(user?.talk_topics) ? user.talk_topics : []);
        const userGoals = req.body.user_goals || (user?.learning_goals && typeof user.learning_goals === 'string' ? JSON.parse(user.learning_goals) : Array.isArray(user?.learning_goals) ? user.learning_goals : []);
        const formality = req.body.formality || 'friendly';
        const feedbackLanguage = req.body.feedback_language || 'en';
        const pythonApiUrl = process.env.PYTHON_API_URL || 'https://beyondwords.onrender.com';
        const response = await axios_1.default.post(`${pythonApiUrl}/detailed_breakdown`, {
            ...req.body,
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
    }
    catch (error) {
        console.error('Detailed breakdown error:', error);
        res.status(500).json({
            error: 'Failed to get detailed breakdown',
            details: error.response?.data || error.message
        });
    }
});
app.post('/api/personas', authenticateJWT, async (req, res) => {
    try {
        const { name, description, topics, formality, language, conversationId } = req.body;
        const userId = req.user.userId;
        if (!name) {
            return res.status(400).json({ error: 'Name is required' });
        }
        const persona = await (0, supabase_db_1.createPersona)(userId, {
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
});
app.get('/api/personas', authenticateJWT, async (req, res) => {
    try {
        const userId = req.user.userId;
        const personas = await (0, supabase_db_1.getUserPersonas)(userId);
        res.json({ personas });
    }
    catch (error) {
        console.error('Error fetching personas:', error);
        res.status(500).json({ error: 'Failed to fetch personas', details: error.message });
    }
});
app.delete('/api/personas/:id', authenticateJWT, async (req, res) => {
    try {
        const personaId = parseInt(req.params.id);
        const result = await (0, supabase_db_1.deletePersona)(personaId);
        if (result.changes === 0) {
            return res.status(404).json({ error: 'Persona not found' });
        }
        res.json({ message: 'Persona deleted successfully' });
    }
    catch (error) {
        console.error('Error deleting persona:', error);
        res.status(500).json({ error: 'Failed to delete persona', details: error.message });
    }
});
app.post('/api/tts', authenticateJWT, async (req, res) => {
    try {
        const { text, language } = req.body;
        if (!text || !text.trim()) {
            return res.status(400).json({ error: 'Text is required' });
        }
        const lang = language || 'en';
        const isHealthy = await checkPythonAPIHealth();
        if (!isHealthy) {
            return res.status(503).json({
                error: 'Python API is not available',
                details: 'The TTS service is temporarily unavailable. Please try again later.'
            });
        }
        const ttsUrl = await generateTTS(text, lang);
        if (ttsUrl) {
            res.json({ ttsUrl });
        }
        else {
            res.status(500).json({ error: 'Failed to generate TTS' });
        }
    }
    catch (error) {
        console.error('TTS endpoint error:', error);
        res.status(500).json({ error: 'TTS generation failed', details: error.message });
    }
});
app.post('/api/tts-test', async (req, res) => {
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
        }
        else {
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
    }
    catch (error) {
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
app.post('/api/quick_translation', authenticateJWT, async (req, res) => {
    try {
        console.log('POST /api/quick_translation called');
        const { ai_message, language, user_level, user_topics, formality, feedback_language, user_goals, description } = req.body;
        if (!ai_message) {
            return res.status(400).json({ error: 'No AI message provided' });
        }
        try {
            const pythonApiUrl = (process.env.PYTHON_API_URL || 'https://beyondwords.onrender.com').replace(/\/$/, '');
            const pythonResponse = await axios_1.default.post(`${pythonApiUrl}/quick_translation`, {
                ai_message: ai_message,
                language: language || 'en',
                user_level: user_level || 'beginner',
                user_topics: user_topics || [],
                formality: formality || 'friendly',
                feedback_language: feedback_language || 'en',
                user_goals: user_goals || [],
                description: description || null
            }, {
                headers: { 'Content-Type': 'application/json' },
                timeout: 30000
            });
            console.log('Python quick translation received');
            res.json(pythonResponse.data);
        }
        catch (pythonError) {
            console.error('Python API not available for quick translation:', pythonError.message);
            res.json({
                translation: "Quick translation service temporarily unavailable",
                error: "Python API not available"
            });
        }
    }
    catch (error) {
        console.error('Quick translation error:', error);
        res.status(500).json({ error: 'Error getting quick translation', details: error.message });
    }
});
app.use('/uploads', express_1.default.static(path_1.default.join(__dirname, 'uploads')));
app.use('/files', express_1.default.static(path_1.default.join(__dirname, '..')));
async function checkPythonAPIHealth() {
    try {
        const pythonApiUrl = process.env.PYTHON_API_URL || 'https://beyondwords.onrender.com';
        console.log(`🔍 Checking Python API health at: ${pythonApiUrl}/health`);
        const response = await axios_1.default.get(`${pythonApiUrl}/health`, {
            timeout: 5000
        });
        console.log(`✅ Python API health check successful:`, response.data);
        return true;
    }
    catch (error) {
        console.error(`❌ Python API health check failed:`, error.message);
        return false;
    }
}
async function generateTTS(text, language) {
    const result = await generateTTSWithDebug(text, language);
    return result.ttsUrl;
}
async function generateTTSWithDebug(text, language) {
    try {
        const ttsFileName = `tts_${Date.now()}.aiff`;
        const ttsFilePath = path_1.default.join(uploadsDir, ttsFileName);
        console.log('🎯 [TTS DEBUG] Generating TTS using admin-controlled system for language:', language);
        console.log('🎯 [TTS DEBUG] TTS text length:', text.length);
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
        const ttsResponse = await axios_1.default.post(`${pythonApiUrl}/generate_tts`, ttsRequestPayload, {
            headers: { 'Content-Type': 'application/json' },
            timeout: 30000
        });
        console.log(`🎯 [TTS DEBUG] Python API response status: ${ttsResponse.status}`);
        console.log(`🎯 [TTS DEBUG] Python API response data:`, ttsResponse.data);
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
            const actualFilePath = ttsResponse.data.output_path;
            console.log(`🎯 [TTS DEBUG] Actual file path from Python API: ${actualFilePath}`);
            if (fs_1.default.existsSync(actualFilePath)) {
                const stats = fs_1.default.statSync(actualFilePath);
                console.log('🎯 [TTS DEBUG] TTS file created, size:', stats.size, 'bytes');
                const fileName = path_1.default.basename(actualFilePath);
                const isInUploads = actualFilePath.includes('uploads');
                const ttsUrl = isInUploads ? `/uploads/${fileName}` : `/files/${fileName}`;
                console.log('🎯 [TTS DEBUG] TTS audio generated at:', ttsUrl);
                console.log('🎯 [TTS DEBUG] File location:', isInUploads ? 'uploads directory' : 'root directory');
                console.log('🎯 [TTS DEBUG] File extension:', path_1.default.extname(actualFilePath));
                return {
                    ttsUrl: ttsUrl,
                    debug: debugInfo
                };
            }
            else {
                console.error('🎯 [TTS DEBUG] TTS file was not created at expected path');
                return {
                    ttsUrl: null,
                    debug: {
                        ...debugInfo,
                        fallback_reason: 'File not created',
                        error: 'TTS file was not created at expected path'
                    }
                };
            }
        }
        else {
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
    }
    catch (ttsError) {
        console.error('🎯 [TTS DEBUG] TTS error details:');
        console.error('🎯 [TTS DEBUG] Error message:', ttsError.message);
        console.error('🎯 [TTS DEBUG] Error code:', ttsError.code);
        console.error('🎯 [TTS DEBUG] Error status:', ttsError.response?.status);
        console.error('🎯 [TTS DEBUG] Error response data:', ttsError.response?.data);
        console.error('🎯 [TTS DEBUG] Error response headers:', ttsError.response?.headers);
        console.error('🎯 [TTS DEBUG] Full error object:', ttsError);
        if (ttsError.response?.status === 429) {
            console.log('🎯 [TTS DEBUG] Rate limit hit - TTS generation failed');
        }
        else if (ttsError.response?.status === 401) {
            console.log('🎯 [TTS DEBUG] Authentication error - check TTS API keys');
        }
        else if (ttsError.response?.status === 500) {
            console.log('🎯 [TTS DEBUG] Python API internal error for TTS');
        }
        else if (ttsError.code === 'ECONNREFUSED') {
            console.log('🎯 [TTS DEBUG] Connection refused - Python API not reachable');
        }
        else if (ttsError.code === 'ETIMEDOUT') {
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
});
