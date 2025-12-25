"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.closeDatabase = exports.getUserStreak = exports.deletePersona = exports.getUserPersonas = exports.createPersona = exports.createConversationWithInitialMessage = exports.addMessage = exports.updateConversationDescription = exports.updateConversationPersona = exports.deleteConversation = exports.updateConversationLearningGoals = exports.updateConversationSynopsis = exports.updateConversationTitle = exports.getConversationWithMessages = exports.getUserConversations = exports.createConversation = exports.deleteLanguageDashboard = exports.updateLanguageDashboard = exports.getLanguageDashboard = exports.getUserLanguageDashboards = exports.createLanguageDashboard = exports.getAllSessions = exports.getSession = exports.saveSession = exports.getAllUsers = exports.updateUser = exports.findUserById = exports.findUserByEmail = exports.findUserByGoogleId = exports.createUser = exports.supabase = void 0;
const supabase_js_1 = require("@supabase/supabase-js");
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
exports.supabase = (0, supabase_js_1.createClient)(supabaseUrl, supabaseServiceKey);
const createUser = async (userData) => {
    const dbData = { ...userData };
    if (userData.googleId) {
        dbData.google_id = userData.googleId;
        delete dbData.googleId;
    }
    if (userData.passwordHash) {
        dbData.password_hash = userData.passwordHash;
        delete dbData.passwordHash;
    }
    if (userData.targetLanguage) {
        dbData.target_language = userData.targetLanguage;
        delete dbData.targetLanguage;
    }
    if (userData.proficiencyLevel) {
        dbData.proficiency_level = userData.proficiencyLevel;
        delete dbData.proficiencyLevel;
    }
    if (userData.talkTopics) {
        dbData.talk_topics = userData.talkTopics;
        delete dbData.talkTopics;
    }
    if (userData.learningGoals) {
        dbData.learning_goals = userData.learningGoals;
        delete dbData.learningGoals;
    }
    if (userData.practicePreference) {
        dbData.practice_preference = userData.practicePreference;
        delete dbData.practicePreference;
    }
    if (userData.onboardingComplete !== undefined) {
        dbData.onboarding_complete = userData.onboardingComplete;
        delete dbData.onboardingComplete;
    }
    const { data, error } = await exports.supabase
        .from('users')
        .insert([dbData])
        .select()
        .single();
    if (error)
        throw error;
    return data;
};
exports.createUser = createUser;
const findUserByGoogleId = async (googleId) => {
    const { data, error } = await exports.supabase
        .from('users')
        .select('*')
        .eq('google_id', googleId)
        .maybeSingle();
    if (error)
        throw error;
    return data;
};
exports.findUserByGoogleId = findUserByGoogleId;
const findUserByEmail = async (email) => {
    const { data, error } = await exports.supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .maybeSingle();
    if (error)
        throw error;
    return data;
};
exports.findUserByEmail = findUserByEmail;
const findUserById = async (id) => {
    const { data, error } = await exports.supabase
        .from('users')
        .select('*')
        .eq('id', id)
        .maybeSingle();
    if (error)
        throw error;
    return data;
};
exports.findUserById = findUserById;
const updateUser = async (id, updates) => {
    const dbUpdates = { ...updates };
    if (updates.googleId) {
        dbUpdates.google_id = updates.googleId;
        delete dbUpdates.googleId;
    }
    if (updates.passwordHash) {
        dbUpdates.password_hash = updates.passwordHash;
        delete dbUpdates.passwordHash;
    }
    if (updates.targetLanguage) {
        dbUpdates.target_language = updates.targetLanguage;
        delete dbUpdates.targetLanguage;
    }
    if (updates.proficiencyLevel) {
        dbUpdates.proficiency_level = updates.proficiencyLevel;
        delete dbUpdates.proficiencyLevel;
    }
    if (updates.talkTopics) {
        dbUpdates.talk_topics = updates.talkTopics;
        delete dbUpdates.talkTopics;
    }
    if (updates.learningGoals) {
        dbUpdates.learning_goals = updates.learningGoals;
        delete dbUpdates.learningGoals;
    }
    if (updates.practicePreference) {
        dbUpdates.practice_preference = updates.practicePreference;
        delete dbUpdates.practicePreference;
    }
    if (updates.onboardingComplete !== undefined) {
        dbUpdates.onboarding_complete = updates.onboardingComplete;
        delete dbUpdates.onboardingComplete;
    }
    const { data, error } = await exports.supabase
        .from('users')
        .update(dbUpdates)
        .eq('id', id)
        .select()
        .single();
    if (error)
        throw error;
    return data;
};
exports.updateUser = updateUser;
const getAllUsers = async () => {
    const { data, error } = await exports.supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });
    if (error)
        throw error;
    return data || [];
};
exports.getAllUsers = getAllUsers;
const saveSession = async (userId, chatHistory, language = 'en') => {
    const { data, error } = await exports.supabase
        .from('sessions')
        .insert([{
            user_id: userId,
            chat_history: JSON.stringify(chatHistory),
            language
        }])
        .select()
        .single();
    if (error)
        throw error;
    return data;
};
exports.saveSession = saveSession;
const getSession = async (userId) => {
    const { data, error } = await exports.supabase
        .from('sessions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
    if (error)
        throw error;
    return data;
};
exports.getSession = getSession;
const getAllSessions = async (userId) => {
    const { data, error } = await exports.supabase
        .from('sessions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
    if (error)
        throw error;
    return data || [];
};
exports.getAllSessions = getAllSessions;
const createLanguageDashboard = async (userId, language, proficiencyLevel, talkTopics, learningGoals, practicePreference, feedbackLanguage = 'en', isPrimary = false) => {
    const { data, error } = await exports.supabase
        .from('language_dashboards')
        .insert([{
            user_id: userId,
            language,
            proficiency_level: proficiencyLevel,
            talk_topics: talkTopics,
            learning_goals: learningGoals,
            practice_preference: practicePreference,
            feedback_language: feedbackLanguage,
            is_primary: isPrimary
        }])
        .select()
        .single();
    if (error)
        throw error;
    return data;
};
exports.createLanguageDashboard = createLanguageDashboard;
const getUserLanguageDashboards = async (userId) => {
    const { data, error } = await exports.supabase
        .from('language_dashboards')
        .select('*')
        .eq('user_id', userId)
        .order('is_primary', { ascending: false });
    if (error)
        throw error;
    return data || [];
};
exports.getUserLanguageDashboards = getUserLanguageDashboards;
const getLanguageDashboard = async (userId, language) => {
    const { data, error } = await exports.supabase
        .from('language_dashboards')
        .select('*')
        .eq('user_id', userId)
        .eq('language', language)
        .maybeSingle();
    if (error)
        throw error;
    return data;
};
exports.getLanguageDashboard = getLanguageDashboard;
const updateLanguageDashboard = async (userId, language, updates) => {
    const { data, error } = await exports.supabase
        .from('language_dashboards')
        .update(updates)
        .eq('user_id', userId)
        .eq('language', language)
        .select()
        .single();
    if (error)
        throw error;
    return data;
};
exports.updateLanguageDashboard = updateLanguageDashboard;
const deleteLanguageDashboard = async (userId, language) => {
    const { error } = await exports.supabase
        .from('language_dashboards')
        .delete()
        .eq('user_id', userId)
        .eq('language', language);
    if (error)
        throw error;
    return { changes: 1 };
};
exports.deleteLanguageDashboard = deleteLanguageDashboard;
const createConversation = async (userId, languageDashboardId, title, topics, formality, description, usesPersona, personaId, learningGoals) => {
    const insertPayload = {
        user_id: userId,
        title,
        topics,
        formality,
        description,
        uses_persona: Boolean(usesPersona),
        persona_id: personaId || null,
        learning_goals: learningGoals
    };
    if (languageDashboardId) {
        insertPayload.language_dashboard_id = languageDashboardId;
    }
    const { data, error } = await exports.supabase
        .from('conversations')
        .insert([insertPayload])
        .select()
        .single();
    if (error)
        throw error;
    return data;
};
exports.createConversation = createConversation;
const getUserConversations = async (userId, language) => {
    if (language) {
        try {
            const dashboard = await (0, exports.getLanguageDashboard)(userId, language);
            if (dashboard?.id) {
                const { data, error } = await exports.supabase
                    .from('conversations')
                    .select('*')
                    .eq('user_id', userId)
                    .eq('language_dashboard_id', dashboard.id)
                    .order('updated_at', { ascending: false });
                if (error)
                    throw error;
                return data || [];
            }
        }
        catch (e) {
        }
    }
    const { data, error } = await exports.supabase
        .from('conversations')
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false });
    if (error)
        throw error;
    return data || [];
};
exports.getUserConversations = getUserConversations;
const getConversationWithMessages = async (conversationId) => {
    const { data, error } = await exports.supabase
        .from('conversations')
        .select(`
      *,
      messages (*)
    `)
        .eq('id', conversationId)
        .maybeSingle();
    if (error)
        throw error;
    return data;
};
exports.getConversationWithMessages = getConversationWithMessages;
const updateConversationTitle = async (conversationId, title) => {
    console.log('🔍 [DB] Updating conversation title:', { conversationId, title: title.substring(0, 50) + '...' });
    const { error, data } = await exports.supabase
        .from('conversations')
        .update({ title })
        .eq('id', conversationId)
        .select('id');
    if (error) {
        console.error('🔍 [DB] Error updating conversation title:', error);
        throw error;
    }
    console.log('🔍 [DB] Conversation title updated successfully, data:', data);
    return { changes: data ? data.length : 1 };
};
exports.updateConversationTitle = updateConversationTitle;
const updateConversationSynopsis = async (conversationId, synopsis, progressData) => {
    const updates = { synopsis };
    if (progressData) {
        try {
            if (typeof progressData === 'object' && progressData !== null) {
                const sanitizedProgressData = {
                    subgoalIds: Array.isArray(progressData.subgoalIds) ? progressData.subgoalIds.slice(0, 50) : [],
                    subgoalNames: Array.isArray(progressData.subgoalNames) ? progressData.subgoalNames.slice(0, 50) : [],
                    percentages: Array.isArray(progressData.percentages) ? progressData.percentages.slice(0, 50) : []
                };
                updates.progress_data = sanitizedProgressData;
                console.log('🔍 [DB] Sanitized progress data:', sanitizedProgressData);
            }
            else {
                console.warn('🔍 [DB] Invalid progressData type, skipping:', typeof progressData);
            }
        }
        catch (e) {
            console.error('🔍 [DB] Error sanitizing progressData:', e);
        }
    }
    console.log('🔍 [DB] Updating conversation synopsis:', {
        conversationId,
        synopsis: synopsis.substring(0, 100) + '...',
        progressDataKeys: progressData ? Object.keys(progressData) : null
    });
    const { error, data } = await exports.supabase
        .from('conversations')
        .update(updates)
        .eq('id', conversationId)
        .select('id');
    if (error) {
        console.error('🔍 [DB] Error updating conversation synopsis:', error);
        console.error('🔍 [DB] Error details:', {
            message: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code
        });
        throw error;
    }
    console.log('🔍 [DB] Conversation synopsis updated successfully, data:', data);
    return { changes: data ? data.length : 1 };
};
exports.updateConversationSynopsis = updateConversationSynopsis;
const updateConversationLearningGoals = async (conversationId, learningGoals) => {
    console.log('🔍 [DB] Updating conversation learning_goals:', { conversationId, learningGoals });
    const { error, data } = await exports.supabase
        .from('conversations')
        .update({ learning_goals: learningGoals })
        .eq('id', conversationId)
        .select('id');
    if (error) {
        console.error('🔍 [DB] Error updating learning_goals:', error);
        throw error;
    }
    console.log('🔍 [DB] Learning goals updated successfully, data:', data);
    return { changes: data ? data.length : 1 };
};
exports.updateConversationLearningGoals = updateConversationLearningGoals;
const deleteConversation = async (conversationId) => {
    const { error } = await exports.supabase
        .from('conversations')
        .delete()
        .eq('id', conversationId);
    if (error)
        throw error;
    return { changes: 1 };
};
exports.deleteConversation = deleteConversation;
const updateConversationPersona = async (conversationId, usesPersona, personaId) => {
    const { error } = await exports.supabase
        .from('conversations')
        .update({
        uses_persona: usesPersona,
        persona_id: personaId
    })
        .eq('id', conversationId);
    if (error)
        throw error;
    return { changes: 1 };
};
exports.updateConversationPersona = updateConversationPersona;
const updateConversationDescription = async (conversationId, description) => {
    const { error } = await exports.supabase
        .from('conversations')
        .update({
        description: description
    })
        .eq('id', conversationId);
    if (error)
        throw error;
    return { changes: 1 };
};
exports.updateConversationDescription = updateConversationDescription;
const addMessage = async (conversationId, sender, text, messageType = 'text', audioFilePath, detailedFeedback, messageOrder, romanizedText) => {
    const { data, error } = await exports.supabase
        .from('messages')
        .insert([{
            conversation_id: conversationId,
            sender,
            text,
            message_type: messageType,
            audio_file_path: audioFilePath,
            detailed_feedback: detailedFeedback,
            message_order: messageOrder,
            romanized_text: romanizedText
        }])
        .select()
        .single();
    if (error)
        throw error;
    return data;
};
exports.addMessage = addMessage;
const createConversationWithInitialMessage = async (userId, languageDashboardId, title, topics, formality, description, usesPersona, personaId, learningGoals, initialAiMessage) => {
    try {
        const insertPayload = {
            user_id: userId,
            title,
            topics,
            formality,
            description,
            uses_persona: Boolean(usesPersona),
            persona_id: personaId || null,
            learning_goals: learningGoals
        };
        if (languageDashboardId) {
            insertPayload.language_dashboard_id = languageDashboardId;
        }
        const { data: conversation, error: convError } = await exports.supabase
            .from('conversations')
            .insert([insertPayload])
            .select()
            .single();
        if (convError)
            throw convError;
        let aiMessage = null;
        if (initialAiMessage && conversation?.id) {
            try {
                const { data: message, error: msgError } = await exports.supabase
                    .from('messages')
                    .insert([{
                        conversation_id: conversation.id,
                        sender: 'AI',
                        text: initialAiMessage,
                        message_type: 'text',
                        message_order: 1
                    }])
                    .select()
                    .single();
                if (msgError) {
                    console.error('❌ Failed to create initial AI message:', msgError);
                    await exports.supabase
                        .from('conversations')
                        .delete()
                        .eq('id', conversation.id);
                    throw new Error(`Failed to create initial AI message: ${msgError.message}`);
                }
                aiMessage = message;
            }
            catch (msgErr) {
                console.error('❌ Error in atomic message creation:', msgErr);
                await exports.supabase
                    .from('conversations')
                    .delete()
                    .eq('id', conversation.id);
                throw msgErr;
            }
        }
        return { conversation, aiMessage };
    }
    catch (error) {
        console.error('❌ Atomic conversation creation failed:', error);
        throw error;
    }
};
exports.createConversationWithInitialMessage = createConversationWithInitialMessage;
const createPersona = async (userId, personaData) => {
    const dbData = {
        user_id: userId,
        ...personaData
    };
    if (personaData.conversationId) {
        dbData.conversation_id = personaData.conversationId;
        delete dbData.conversationId;
    }
    const { data, error } = await exports.supabase
        .from('personas')
        .insert([dbData])
        .select()
        .single();
    if (error)
        throw error;
    return data;
};
exports.createPersona = createPersona;
const getUserPersonas = async (userId) => {
    const { data, error } = await exports.supabase
        .from('personas')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
    if (error)
        throw error;
    return data || [];
};
exports.getUserPersonas = getUserPersonas;
const deletePersona = async (personaId) => {
    const { error } = await exports.supabase
        .from('personas')
        .delete()
        .eq('id', personaId);
    if (error)
        throw error;
    return { changes: 1 };
};
exports.deletePersona = deletePersona;
const getUserStreak = async (userId, language) => {
    return {
        current_streak: 0,
        longest_streak: 0,
        last_practice_date: null
    };
};
exports.getUserStreak = getUserStreak;
const closeDatabase = async () => {
};
exports.closeDatabase = closeDatabase;
