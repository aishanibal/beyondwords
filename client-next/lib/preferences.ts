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
  goal: string;
  icon: string;
  subgoals?: { id: string; description: string }[];
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
  { code: 'fr', label: 'French', flag: '🇫🇷', description: 'Pratiquez le français avec l\'IA' },
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
  { level: 'beginner', label: 'Beginner', description: 'I can use simple greetings and a handful of words, but struggle to form sentences.', icon: '🌱' },
  { level: 'elementary', label: 'Elementary', description: 'I can handle basic everyday interactions in short, simple sentences.', icon: '🌿' },
  { level: 'intermediate', label: 'Intermediate', description: 'I can discuss familiar topics, understand main points, and ask questions.', icon: '🌳' },
  { level: 'advanced', label: 'Advanced', description: 'I can express detailed ideas, adapt my language, and engage comfortably in conversation.', icon: '🏔️' },
  { level: 'fluent', label: 'Fluent', description: 'I speak effortlessly, understand nuances, and participate in complex discussions.', icon: '🗝️' }
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
    id: "speak_fluently",
    goal: "Speak without freezing or second-guessing",
    icon: "💪",
    subgoals: [
      // { id: "speak_fluently_1", description: "Average response time per turn is below 5 seconds." },
      { id: "speak_fluently_2", description: "No more than 1 long pause (e.g., >8s) every 5 turns." },
      { id: "speak_fluently_3", description: "Fewer than 10% of turns are skipped or answered with placeholders like “I don’t know.”" },
      { id: "speak_fluently_4", description: "At least 80% of responses are full sentences, not one-word replies." },
      // { id: "speak_fluently_5", description: "Response length variance stays within a natural range (i.e., avoids abrupt drop to single words mid-conversation)." }
    ]
  },
  // {
  //   id: "be_understood",
  //   goal: "Be clearly understood by native speakers",
  //   icon: "🗣️",
  //   subgoals: [
  //     { id: "be_understood_1", description: ">90% of user utterances do not trigger re-prompts or clarifications from the AI." },
  //     { id: "be_understood_2", description: ">85% speech-to-text accuracy for user utterances (for voice input sessions)." },
  //     { id: "be_understood_3", description: "Less than 1 misunderstanding per 10 turns, based on mismatched response logic." },
  //     { id: "be_understood_4", description: "<5% of user turns are flagged as unintelligible by ASR or NLP components." },
  //     { id: "be_understood_5", description: "Minimal correction interventions needed from the AI for pronunciation or clarity." }
  //   ]
  // },
  {
    id: "converse_smoothly",
    goal: "Hold flowing, back-and-forth conversations",
    icon: "💬",
    subgoals: [
      { id: "converse_smoothly_1", description: "Maintain topic cohesion for at least 75% of the conversation (no unrelated shifts)." },
      // { id: "converse_smoothly_2", description: "Logical progression in 80%+ of user responses (builds on AI’s turn)." },
      { id: "converse_smoothly_3", description: "At least 3 instances of elaborating beyond yes/no when appropriate." },
      { id: "converse_smoothly_4", description: "No more than 2 one-word responses in a 10-turn span." },
      // { id: "converse_smoothly_5", description: "<10% of turns result in conversation breakdown or restart prompts." }
    ]
  },
  {
    id: "use_daily_vocab",
    goal: "Use the right words in daily conversations",
    icon: "📚",
    subgoals: [
      { id: "use_daily_vocab_1", description: "80%+ of content words match the selected topic domain or are semantically relevant." },
      { id: "use_daily_vocab_2", description: "Fewer than 2 vague terms per 10 turns (“thing,” “stuff,” etc.)." },
      // { id: "use_daily_vocab_3", description: "Use of tier-1 (high-frequency) vocabulary in at least 70% of turns." },
      { id: "use_daily_vocab_4", description: "No excessive repetition: same content word repeated >3 times within 5 turns triggers flag." },
      // { id: "use_daily_vocab_5", description: "Correct usage of topic-specific nouns/verbs in at least 3 different turns." }
    ]
  },
  {
    id: "use_grammar_correctly",
    goal: "Use correct verb tenses and sentence patterns",
    icon: "🔤",
    subgoals: [
      { id: "use_grammar_correctly_1", description: "Correct tense used in ≥85% of turns based on context (past, present, future)." },
      { id: "use_grammar_correctly_2", description: "At least 80% of user turns follow basic sentence structures (SVO or equivalent)." },
      { id: "use_grammar_correctly_3", description: "Conjugation error rate stays under 10% across all user verbs." },
      // { id: "use_grammar_correctly_4", description: "Complex sentence used in ≥20% of turns (with conjunctions, clauses, etc.)." },
      // { id: "use_grammar_correctly_5", description: "No inconsistent tense switching within the same response in ≥95% of cases." }
    ]
  },
  {
    id: "listen_and_understand",
    goal: "Catch what people say the first time",
    icon: "👂",
    subgoals: [
      // { id: "listen_and_understand_1", description: "User responds appropriately to AI input in ≥90% of turns (no non-sequiturs)." },
      { id: "listen_and_understand_2", description: "Fewer than 1 clarification request (“What?”, “Repeat?”) per 10 turns." },
      { id: "listen_and_understand_3", description: "At least 2 references to something the AI previously said (demonstrating comprehension)." },
      // { id: "listen_and_understand_4", description: "No repeated questions (asking something already answered) in the same session." },
      { id: "listen_and_understand_5", description: "No evidence of explanation feature usage for comprehension support." }
    ]
  },
  {
    id: "respond_without_translating",
    goal: "Respond quickly without translating in your head",
    icon: "⚡",
    subgoals: [
      // { id: "respond_without_translating_1", description: "Median response latency < 5 seconds." },
      // { id: "respond_without_translating_2", description: "Response time consistency (no spike >8s more than twice per session)." },
      { id: "respond_without_translating_3", description: "Do not code switch to native language (0–5% of total words spoken)." },
      // { id: "respond_without_translating_4", description: "At least 3 consecutive turns spoken fluidly within 5s each." },
      { id: "respond_without_translating_5", description: "Limited use of translation/help buttons (e.g., <2 times per 10 turns)." }
    ]
  },
  {
    id: "use_common_expressions",
    goal: "Learn common expressions used in real life",
    icon: "🛒",
    subgoals: [
      { id: "use_common_expressions_1", description: "Uses 2+ idiomatic or set expressions correctly across a conversation." },
      // { id: "use_common_expressions_2", description: "Expressions reused naturally in different turns or contexts." },
      { id: "use_common_expressions_3", description: "No misuse of literal equivalents (e.g., “make party” instead of “throw a party”) in 95%+ of cases." },
      // { id: "use_common_expressions_4", description: "Recognizes and responds correctly to 80% of AI’s colloquial expressions." },
      { id: "use_common_expressions_5", description: "Common expressions constitute ≥10% of all content-bearing phrases used." }
    ]
  },
  {
    id: "ask_follow_up_questions",
    goal: "Get better at asking natural follow-up questions",
    icon: "❓",
    subgoals: [
      { id: "ask_follow_up_questions_1", description: "Asks at least 1 follow-up question per 5 turns during the session." },
      { id: "ask_follow_up_questions_2", description: "≥75% of questions are context-aware, i.e., based on the AI’s previous message." },
      { id: "ask_follow_up_questions_3", description: "Uses at least 3 different question types (who, what, when, where, why, how or equivalient)." },
      // { id: "ask_follow_up_questions_4", description: "No question form errors in ≥90% of questions asked." },
      // { id: "ask_follow_up_questions_5", description: "Does not overuse help button for generating questions (>1 use per 10 turns triggers flag)." }
    ]
  },
  {
    id: "tell_personal_stories",
    goal: "Tell personal stories clearly and confidently",
    icon: "📖",
    subgoals: [
      { id: "tell_personal_stories_1", description: "At least one full narrative (3+ turns) is present, with events in logical sequence." },
      { id: "tell_personal_stories_2", description: "Past tense accuracy maintained in ≥85% of storytelling-related verbs." },
      // { id: "tell_personal_stories_3", description: "Narrative includes emotional or reflective elements in at least 2 turns." },
      { id: "tell_personal_stories_4", description: "Transition words (e.g., “then,” “after that”) used at least twice." },
      // { id: "tell_personal_stories_5", description: "No AI confusion or clarifications requested during the story turn sequence." }
    ]
  },
  // {
  //   id: "switch_languages_well",
  //   goal: "Switch smoothly between languages when needed",
  //   icon: "🔁",
  //   subgoals: [
  //     { id: "switch_languages_well_1", description: "No full turn in native language, unless explicitly triggered by a help request." },
  //     { id: "switch_languages_well_2", description: "Code-switching used sparingly (≤1 per 5 turns) and only at term level." },
  //     { id: "switch_languages_well_3", description: "Switches back to target language immediately within the same or next sentence." },
  //     { id: "switch_languages_well_4", description: "No prolonged mixing of languages across >2 consecutive utterances." },
  //     { id: "switch_languages_well_5", description: "AI remains in target language without being forced to switch by user confusion." }
  //   ]
  // },
  {
    id: "express_emotions_well",
    goal: "Express emotions naturally and culturally appropriately",
    icon: "😊",
    subgoals: [
      { id: "express_emotions_well_1", description: "Use at least 5 unique emotionally expressive words in a session." },
      // { id: "express_emotions_well_2", description: "Tone or phrases match context in ≥90% of user responses (e.g., no “that’s awesome” after bad news)." },
      { id: "express_emotions_well_3", description: "Emotion-related grammar structures (e.g., subjunctive, modals) used at least once." },
      { id: "express_emotions_well_4", description: "Avoids culturally inappropriate emotional expressions (e.g., exaggeration, sarcasm misuse) in 100% of turns." },
      // { id: "express_emotions_well_5", description: "Emotion vocabulary varies across the session (not just “happy/sad”)." }
    ]
  },
  {
    id: "respect_cultural_contexts",
    goal: "Avoid misunderstandings tied to cultural context",
    icon: "🌍",
    subgoals: [
      {
        id: "respect_cultural_contexts_1",
        description: "Use appropriate formality and honorifics based on cultural norms."
      },
      {
        id: "respect_cultural_contexts_2",
        description: "Incorporate at least one culturally relevant idiom or proverb per session."
      },
      {
        id: "respect_cultural_contexts_3",
        description: "Reference local customs or traditions when discussing related topics."
      },
    ]
  }
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