export interface ChatMessage {
  id?: string;
  sender: string;
  text: string;
  romanizedText?: string;
  timestamp: Date;
  messageType?: string;
  audioFilePath?: string | null;
  ttsUrl?: string | null;
  translation?: string;
  breakdown?: string;
  detailedFeedback?: string;
  shortFeedback?: string;
  showDetailedFeedback?: boolean;
  showShortFeedback?: boolean;
  showDetailedBreakdown?: boolean;
  isSuggestion?: boolean;
  suggestionIndex?: number;
  totalSuggestions?: number;
  isFromOriginalConversation?: boolean; // Track if message is from original conversation
  isProcessing?: boolean; // Track if message is being processed
}

export interface User {
  id: string;
  email: string;
  name?: string;
  selectedLanguage?: string;
  target_language?: string;
  language?: string;
  proficiency_level?: string;
  learning_goals?: string[];
  talk_topics?: string[];
  [key: string]: unknown;
}

export interface LearningGoal {
  id: string;
  name: string;
  description: string;
  subgoals: Subgoal[];
}

export interface Subgoal {
  id: string;
  name: string;
  description: string;
  level: number;
  maxLevel: number;
}

export interface SubgoalProgress {
  subgoalId: string;
  currentLevel: number;
  maxLevel: number;
  isCompleted: boolean;
}

export interface LevelUpEvent {
  subgoalId: string;
  oldLevel: number;
  newLevel: number;
  subgoalName: string;
}

export interface FormattedText {
  mainText: string;
  romanizedText?: string;
}

export interface TranslationData {
  translation?: string;
  breakdown?: string;
  has_breakdown?: boolean;
}

export interface SuggestionData {
  text: string;
  explanation?: string;
  [key: string]: unknown;
}

export interface PersonaData {
  name: string;
  description: string;
  topics: string[];
  formality: string;
  language: string;
  conversationId: string;
  userId: string;
}

export interface ConversationSummary {
  synopsis: string;
  keyTopics: string[];
  languageUsed: string;
  difficultyLevel: string;
  suggestions: string[];
}

// Constants
export const CLOSENESS_LEVELS: { [key: string]: string } = {
  intimate: '👫 Intimate: Close friends, family, or partners',
  friendly: '😊 Friendly: Peers, classmates, or casual acquaintances',
  respectful: '🙏 Respectful: Teachers, elders, or professionals',
  formal: '🎩 Formal: Strangers, officials, or business contacts',
  distant: '🧑‍💼 Distant: Large groups, public speaking, or unknown audience',
};

export const SCRIPT_LANGUAGES: { [key: string]: string } = {
  'hi': 'Devanagari',
  'ja': 'Japanese',
  'zh': 'Chinese',
  'ko': 'Korean',
  'ar': 'Arabic',
  'ta': 'Tamil',
  'ml': 'Malayalam',
  'or': 'Odia',
  'th': 'Thai',
  'bn': 'Bengali',
  'pa': 'Punjabi',
  'gu': 'Gujarati',
  'mr': 'Marathi',
  'kn': 'Kannada',
  'te': 'Telugu'
};

// Utility functions
export const getLanguageLabel = (code: string): string => {
  const languages: { [key: string]: string } = {
    'en': 'English',
    'es': 'Spanish',
    'fr': 'French',
    'zh': 'Mandarin',
    'ja': 'Japanese',
    'ko': 'Korean',
    'tl': 'Tagalog',
    'hi': 'Hindi',
    'ml': 'Malayalam',
    'ta': 'Tamil',
    'or': 'Odia',
  };
  return languages[code] || 'English';
};

export const isScriptLanguage = (languageCode: string): boolean => {
  return languageCode in SCRIPT_LANGUAGES;
};

export const formatScriptLanguageText = (text: string, languageCode: string): { mainText: string; romanizedText?: string } => {
  if (!isScriptLanguage(languageCode)) {
    return { mainText: text };
  }
  
  // Check if the text already contains romanized format (text) or (romanized)
  if (text.includes('(') && text.includes(')')) {
    // Try different patterns to extract main text and romanized text
    // Pattern 1: text (romanized) at the end
    let match = text.match(/^(.+?)\s*\(([^)]+)\)$/);
    if (match) {
      return { mainText: match[1].trim(), romanizedText: match[2].trim() };
    }
    
    // Pattern 2: text (romanized) anywhere in the text
    match = text.match(/^(.+?)\s*\(([^)]+)\)/);
    if (match) {
      return { mainText: match[1].trim(), romanizedText: match[2].trim() };
    }
    
    // Pattern 3: (romanized) text - romanized at the beginning
    match = text.match(/^\(([^)]+)\)\s*(.+)$/);
    if (match) {
      return { mainText: match[2].trim(), romanizedText: match[1].trim() };
    }
  }
  
  // If it's a script language but doesn't have romanization, return as is
  // The AI should handle the formatting, but this is a fallback
  return { mainText: text };
};

// Normalize spacing around punctuation in romanized output
// Example: "kimi no na wa daisuki ." -> "kimi no na wa daisuki."
// Also covers full-width punctuation (，。、「」) and Arabic/Indic punctuation (، ؟ ؛ । ॥)
export const fixRomanizationPunctuation = (input: string): string => {
  if (!input) return input;
  let output = input;
  // Remove spaces before common ASCII punctuation
  output = output.replace(/\s+([.,!?;:)\]\}])/g, '$1');
  // Also handle spaces before Japanese full-width punctuation if present
  output = output.replace(/\s+([。、「」『』（）！？：；，])/g, '$1');
  // Handle spaces before Arabic and Indic punctuation
  output = output.replace(/\s+([،؟؛।॥])/g, '$1');
  // Collapse multiple spaces
  output = output.replace(/\s{2,}/g, ' ');
  // Trim leading/trailing spaces
  output = output.trim();
  // Normalize Unicode to NFC to combine diacritics properly (e.g., IAST macrons)
  try { output = output.normalize('NFC'); } catch {}
  return output;
};
