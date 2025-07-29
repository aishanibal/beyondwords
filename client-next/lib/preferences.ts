// List of supported languages for onboarding and language dashboard flows
export interface Language {
  code: string;
  label: string;
  flag: string;
  description: string;
}

export interface ProficiencyLevel {
  level: string;
  label: string;
  description: string;
  icon: string;
}

export interface Topic {
  id: string;
  label: string;
  icon: string;
}

export interface LearningGoal {
  id: string;
  label: string;
  icon: string;
}

export interface PracticePreference {
  id: string;
  label: string;
  description: string;
}

export interface FeedbackLanguage {
  code: string;
  label: string;
}
export const LANGUAGES: Language[] = [
  { code: 'en', label: 'English', flag: '🇺🇸', description: 'Practice English with AI' },
  { code: 'es', label: 'Spanish', flag: '🇪🇸', description: 'Practica español con IA' },
  { code: 'fr', label: 'French', flag: '🇫🇷', description: 'Pratiquez le français avec l’IA' },
  { code: 'zh', label: 'Mandarin', flag: '🇨🇳', description: '用AI练习中文' },
  { code: 'ja', label: 'Japanese', flag: '🇯🇵', description: 'AIで日本語を練習する' },
  { code: 'ko', label: 'Korean', flag: '🇰🇷', description: 'AI와 함께 한국어 연습하기' },
  { code: 'tl', label: 'Tagalog', flag: '🇵🇭', description: 'Mag-practice ng Filipino gamit ang AI' },
  { code: 'hi', label: 'Hindi', flag: '🇮🇳', description: 'AI के साथ हिंदी का अभ्यास करें' },
  { code: 'ml', label: 'Malayalam', flag: '🇮🇳', description: 'AI ഉപയോഗിച്ച് മലയാളം പരിശീലിക്കുക' },
  { code: 'ta', label: 'Tamil', flag: '🇮🇳', description: 'AI உடன் தமிழ் பயிற்சி' },
  { code: 'or', label: 'Odia', flag: '🇮🇳', description: 'AI ସହିତ ଓଡ଼ିଆ ଅଭ୍ୟାସ କରନ୍ତୁ' },
];

export const PROFICIENCY_LEVELS: ProficiencyLevel[] = [
  { 
    level: 'beginner', 
    label: 'Beginner',
    description: 'I can use simple greetings and a handful of words, but struggle to form sentences.',
    icon: '🌱'
  },
  { 
    level: 'elementary', 
    label: 'Elementary',
    description: 'I can handle basic everyday interactions in short, simple sentences.',
    icon: '🌿'
  },
  { 
    level: 'intermediate', 
    label: 'Intermediate',
    description: 'I can discuss familiar topics, understand main points, and ask questions.',
    icon: '🌳'
  },
  { 
    level: 'advanced', 
    label: 'Advanced',
    description: 'I can express detailed ideas, adapt my language, and engage comfortably in conversation.',
    icon: '🏔️'
  },
  { 
    level: 'fluent', 
    label: 'Fluent',
    description: 'I speak effortlessly, understand nuances, and participate in complex discussions.',
    icon: '🗝️'
  }
];

export const TALK_TOPICS: Topic[] = [
  { id: 'family',    label: 'Family and relationships',            icon: '👨‍👩‍👧‍👦' },
  { id: 'travel',    label: 'Travel experiences and cultures',      icon: '✈️' },
  { id: 'heritage',  label: 'Cultural heritage and traditions',     icon: '🏛️' },
  { id: 'business',  label: 'Work and professional life',           icon: '💼' },
  { id: 'media',     label: 'Movies, music, and media',             icon: '🎬' },
  { id: 'food',      label: 'Food and cooking',                     icon: '🍽️' },
  { id: 'hobbies',   label: 'Hobbies and leisure activities',       icon: '🎨' },
  { id: 'news',      label: 'News and current events',              icon: '📰' },
  { id: 'sports',    label: 'Sports and fitness',                   icon: '⚽️' },
  { id: 'education', label: 'Education and learning',               icon: '📚' },
  { id: 'technology', label: 'Technology and innovation',           icon: '💻' },
  { id: 'health',    label: 'Health and wellness',                  icon: '🏥' }
];

export const LEARNING_GOALS: LearningGoal[] = [
  {
    id: 'confidence',
    label: 'Speak without freezing or second-guessing',
    icon: '💪',
  },
  {
    id: 'pronunciation',
    label: 'Be clearly understood by native speakers',
    icon: '🗣️',
  },
  {
    id: 'fluency',
    label: 'Hold flowing, back-and-forth conversations',
    icon: '💬',
  },
  {
    id: 'vocabulary',
    label: 'Use the right words in daily conversations',
    icon: '📚',
  },
  {
    id: 'grammar',
    label: 'Use correct verb tenses and sentence patterns',
    icon: '🔤',
  },
  {
    id: 'listening',
    label: 'Catch what people say the first time',
    icon: '👂',
  },
  {
    id: 'response_speed',
    label: 'Respond quickly without translating in your head',
    icon: '⚡',
  },
  {
    id: 'everyday_phrases',
    label: 'Learn common expressions used in real life',
    icon: '🛒',
  },
  {
    id: 'question_asking',
    label: 'Get better at asking natural follow-up questions',
    icon: '❓',
  },
  {
    id: 'storytelling',
    label: 'Tell personal stories clearly and confidently',
    icon: '📖',
  },
  {
    id: 'code_switching',
    label: 'Switch smoothly between languages when needed',
    icon: '🔁',
  },
  {
    id: 'emotion_expressing',
    label: 'Express emotions naturally and culturally appropriately',
    icon: '😊',
  },
  {
    id: 'cultural_clarity',
    label: 'Avoid misunderstandings tied to cultural context',
    icon: '🌍',
  },
];

export const PRACTICE_PREFERENCES: PracticePreference[] = [
  { 
    id: 'daily_short', 
    label: 'Daily short sessions (5-15 minutes)',
    description: 'Perfect for busy schedules - quick daily practice with focused exercises'
  },
  { 
    id: 'few_times_week', 
    label: 'Few times a week (20-30 minutes)',
    description: 'Balanced approach with deeper practice sessions when you have time'
  },
  { 
    id: 'weekly_long', 
    label: 'Weekly longer sessions (45+ minutes)',
    description: 'Intensive practice with comprehensive lessons and conversations'
  },
  { 
    id: 'flexible', 
    label: 'Flexible scheduling',
    description: 'Adapt to your schedule - practice when you can, for as long as you want'
  }
]; 

export const CLOSENESS_LEVELS: Record<string, string> = {
  intimate: "Intimate/Familiar: Very casual. Used with close friends, romantic partners, younger siblings, or yourself. Informal pronouns, dropped particles, relaxed tone.",
  friendly: "Friendly/Peer: Casual or semi-formal. Used with classmates, coworkers, or equals. Informal but respectful tone; friendly pronouns.",
  respectful: "Respectful/Polite: Polite and formal. Used with strangers, elders, teachers, or clients. Uses honorifics, full grammar, and avoids slang.",
  formal: "Humble/Very Formal: Highly respectful. Used with seniors, officials, in ceremonies, or when showing deference. Uses humble language and elevated honorifics.",
  distant: "Distant/Neutral: Detached or clinical. Used in formal writing, legal contexts, or cold interactions. Impersonal tone, no slang, and grammatically precise."
}; 

export const FEEDBACK_LANGUAGES: FeedbackLanguage[] = [
  { code: 'en', label: 'English' },
  { code: 'es', label: 'Spanish' },
  { code: 'fr', label: 'French' },
  { code: 'zh', label: 'Chinese' },
  { code: 'ja', label: 'Japanese' },
  { code: 'tl', label: 'Tagalog' },
  { code: 'hi', label: 'Hindi' },
  { code: 'ko', label: 'Korean' },
  { code: 'ml', label: 'Malayalam' },
  { code: 'ta', label: 'Tamil' },
  { code: 'or', label: 'Odia' }
]; 