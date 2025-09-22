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
  id?: string;
  email?: string;
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
  'ja': 'Japanese',
  'ko': 'Korean', 
  'zh': 'Chinese',
  'hi': 'Hindi',
  'ar': 'Arabic',
  'th': 'Thai',
  'ru': 'Russian',
  'el': 'Greek',
  'he': 'Hebrew',
  'bn': 'Bengali',
  'gu': 'Gujarati',
  'ta': 'Tamil',
  'te': 'Telugu',
  'ml': 'Malayalam',
  'kn': 'Kannada',
  'pa': 'Punjabi',
  'or': 'Odia',
  'as': 'Assamese',
  'ne': 'Nepali',
  'si': 'Sinhala',
  'my': 'Burmese',
  'km': 'Khmer',
  'lo': 'Lao',
  'ka': 'Georgian',
  'hy': 'Armenian',
  'am': 'Amharic',
  'ti': 'Tigrinya',
  'om': 'Oromo',
  'so': 'Somali',
  'sw': 'Swahili',
  'zu': 'Zulu',
  'xh': 'Xhosa',
  'af': 'Afrikaans',
  'sq': 'Albanian',
  'az': 'Azerbaijani',
  'be': 'Belarusian',
  'bg': 'Bulgarian',
  'bs': 'Bosnian',
  'ca': 'Catalan',
  'cs': 'Czech',
  'da': 'Danish',
  'et': 'Estonian',
  'eu': 'Basque',
  'fa': 'Persian',
  'fi': 'Finnish',
  'gl': 'Galician',
  'hr': 'Croatian',
  'hu': 'Hungarian',
  'is': 'Icelandic',
  'it': 'Italian',
  'kk': 'Kazakh',
  'ky': 'Kyrgyz',
  'lt': 'Lithuanian',
  'lv': 'Latvian',
  'mk': 'Macedonian',
  'mn': 'Mongolian',
  'mt': 'Maltese',
  'nl': 'Dutch',
  'no': 'Norwegian',
  'pl': 'Polish',
  'pt': 'Portuguese',
  'ro': 'Romanian',
  'sk': 'Slovak',
  'sl': 'Slovenian',
  'sr': 'Serbian',
  'sv': 'Swedish',
  'tr': 'Turkish',
  'uk': 'Ukrainian',
  'uz': 'Uzbek',
  'vi': 'Vietnamese',
  'cy': 'Welsh',
  'yi': 'Yiddish',
};
