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
  subtopics?: string[];
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

export const TALK_TOPICS: Topic[] = [
  {
    id: 'family',
    label: 'Family and relationships',
    icon: '👨‍👩‍👧‍👦',
    subtopics: [
      'Sharing a nostalgic memory with a sibling',
      'Explaining family holiday traditions with pride',
      'Reflecting thoughtfully on generational differences',
      'Talking emotionally about someone who inspires you'
    ]
  },
  {
    id: 'travel',
    label: 'Travel experiences and cultures',
    icon: '✈️',
    subtopics: [
      'Describing an adventurous past trip',
      'Planning an excited dream vacation',
      'Comparing hometowns with curiosity',
      'Laughing about a humorous travel mishap'
    ]
  },
  {
    id: 'heritage',
    label: 'Cultural heritage and traditions',
    icon: '🏛️',
    subtopics: [
      'Explaining a cultural tradition with pride',
      'Describing a joyful holiday celebration',
      'Reflecting thoughtfully on your cultural identity',
      'Sharing a sentimental story passed down in your family'
    ]
  },
  {
    id: 'business',
    label: 'Work and professional life',
    icon: '💼',
    subtopics: [
      'Describing a neutral typical workday',
      'Imagining your dream job with aspiration',
      'Talking collaboratively about a team project',
      'Expressing frustration about a workplace challenge'
    ]
  },
  {
    id: 'media',
    label: 'Movies, music, and media',
    icon: '🎬',
    subtopics: [
      'Talking enthusiastically about a favorite movie',
      'Sharing an emotional music memory',
      'Comparing old and modern media analytically',
      'Recommending a show or artist in a friendly way'
    ]
  },
  {
    id: 'food',
    label: 'Food and cooking',
    icon: '🍽️',
    subtopics: [
      'Explaining how to make a dish with confidence',
      'Sharing a nostalgic memorable meal',
      'Comparing cultural cuisines with curiosity',
      'Talking warmly about food from your childhood'
    ]
  },
  {
    id: 'hobbies',
    label: 'Hobbies and leisure activities',
    icon: '🎨',
    subtopics: [
      'Talking passionately about a favorite hobby',
      'Describing a new activity with excitement',
      'Explaining a relaxed weekend routine',
      'Sharing how you got into a hobby with personal reflection'
    ]
  },
  {
    id: 'news',
    label: 'News and current events',
    icon: '📰',
    subtopics: [
      'Discussing a recent news story with awareness',
      'Explaining your view on an issue with conviction',
      'Comparing news coverage in a critical tone',
      'Talking about staying informed in a practical way'
    ]
  },
  {
    id: 'sports',
    label: 'Sports and fitness',
    icon: '⚽️',
    subtopics: [
      'Telling a sports memory with pride',
      'Describing a fitness routine in a motivated way',
      'Explaining a popular sport with excitement',
      'Talking about team spirit with enthusiasm'
    ]
  },
  {
    id: 'education',
    label: 'Education and learning',
    icon: '📚',
    subtopics: [
      'Talking about a favorite subject with interest',
      'Sharing a mentor story with gratitude',
      'Describing a learning goal with determination',
      'Reflecting on learning styles thoughtfully'
    ]
  },
  {
    id: 'technology',
    label: 'Technology and innovation',
    icon: '💻',
    subtopics: [
      'Explaining a helpful app with clarity',
      'Talking about essential tech with appreciation',
      'Imagining future technology with curiosity',
      'Discussing social media impact critically'
    ]
  },
  {
    id: 'health',
    label: 'Health and wellness',
    icon: '🏥',
    subtopics: [
      'Describing a health routine calmly',
      'Talking about managing stress with honesty',
      'Discussing mental health with care',
      'Sharing advice for staying well supportively'
    ]
  }
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