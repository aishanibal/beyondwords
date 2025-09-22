import unidecode from 'unidecode';
import { FormattedText } from '../types/analyze';

export const getLanguageLabel = (code: string): string => {
  const languageMap: { [key: string]: string } = {
    'en': 'English',
    'es': 'Spanish',
    'fr': 'French',
    'de': 'German',
    'it': 'Italian',
    'pt': 'Portuguese',
    'ru': 'Russian',
    'ja': 'Japanese',
    'ko': 'Korean',
    'zh': 'Chinese',
    'ar': 'Arabic',
    'hi': 'Hindi',
    'th': 'Thai',
    'vi': 'Vietnamese',
    'tr': 'Turkish',
    'pl': 'Polish',
    'nl': 'Dutch',
    'sv': 'Swedish',
    'da': 'Danish',
    'no': 'Norwegian',
    'fi': 'Finnish',
    'cs': 'Czech',
    'hu': 'Hungarian',
    'ro': 'Romanian',
    'bg': 'Bulgarian',
    'hr': 'Croatian',
    'sk': 'Slovak',
    'sl': 'Slovenian',
    'et': 'Estonian',
    'lv': 'Latvian',
    'lt': 'Lithuanian',
    'uk': 'Ukrainian',
    'be': 'Belarusian',
    'mk': 'Macedonian',
    'sr': 'Serbian',
    'bs': 'Bosnian',
    'sq': 'Albanian',
    'mt': 'Maltese',
    'is': 'Icelandic',
    'ga': 'Irish',
    'cy': 'Welsh',
    'eu': 'Basque',
    'ca': 'Catalan',
    'gl': 'Galician',
    'el': 'Greek',
    'he': 'Hebrew',
    'fa': 'Persian',
    'ur': 'Urdu',
    'bn': 'Bengali',
    'ta': 'Tamil',
    'te': 'Telugu',
    'ml': 'Malayalam',
    'kn': 'Kannada',
    'gu': 'Gujarati',
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
    'az': 'Azerbaijani',
    'kk': 'Kazakh',
    'ky': 'Kyrgyz',
    'uz': 'Uzbek',
    'mn': 'Mongolian',
    'am': 'Amharic',
    'ti': 'Tigrinya',
    'om': 'Oromo',
    'so': 'Somali',
    'sw': 'Swahili',
    'zu': 'Zulu',
    'xh': 'Xhosa',
    'af': 'Afrikaans',
    'yi': 'Yiddish'
  };
  
  return languageMap[code] || code.toUpperCase();
};

export const cleanTextForTTS = (text: string): string => {
  // Remove markdown formatting
  let cleaned = text
    .replace(/\*\*(.*?)\*\*/g, '$1') // Bold
    .replace(/\*(.*?)\*/g, '$1') // Italic
    .replace(/`(.*?)`/g, '$1') // Code
    .replace(/#{1,6}\s/g, '') // Headers
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Links
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, '$1') // Images
    .replace(/\n+/g, ' ') // Newlines to spaces
    .replace(/\s+/g, ' ') // Multiple spaces to single
    .trim();

  // Remove any remaining special characters that might cause TTS issues
  cleaned = cleaned.replace(/[^\w\s.,!?;:'"-]/g, '');
  
  return cleaned;
};

export const extractCorrectedVersion = (feedback: string): FormattedText | null => {
  // Look for patterns like "Corrected version: ..." or "Here's the corrected version: ..."
  const patterns = [
    /(?:corrected version|here's the corrected version|the corrected version is):\s*(.+?)(?:\n|$)/i,
    /(?:corrected|fixed):\s*(.+?)(?:\n|$)/i,
    /(?:should be|it should be):\s*(.+?)(?:\n|$)/i
  ];

  for (const pattern of patterns) {
    const match = feedback.match(pattern);
    if (match) {
      const correctedText = match[1].trim();
      return { mainText: correctedText };
    }
  }

  return null;
};

export const parseFeedbackExplanations = (feedback: string): Record<string, string> => {
  const explanations: Record<string, string> = {};
  
  // Look for patterns like "Grammar: ..." or "Pronunciation: ..."
  const explanationPattern = /(?:Grammar|Pronunciation|Vocabulary|Culture|Usage|Style|Tone|Formality|Politeness|Context|Meaning|Structure|Word Order|Particles|Honorifics|Formal Language|Informal Language|Casual Language|Business Language|Academic Language|Everyday Language|Conversational Language|Written Language|Spoken Language|Regional Variation|Dialect|Accent|Intonation|Stress|Rhythm|Pacing|Clarity|Fluency|Accuracy|Naturalness|Appropriateness|Effectiveness|Impact|Engagement|Connection|Understanding|Comprehension|Learning|Improvement|Progress|Development|Growth|Mastery|Proficiency|Skill|Ability|Competence|Confidence|Motivation|Interest|Curiosity|Exploration|Discovery|Insight|Awareness|Knowledge|Wisdom|Experience|Practice|Repetition|Consistency|Persistence|Patience|Dedication|Commitment|Effort|Hard Work|Time|Energy|Focus|Attention|Concentration|Memory|Recall|Recognition|Association|Connection|Pattern|Rule|Principle|Concept|Idea|Thought|Understanding|Comprehension|Analysis|Synthesis|Evaluation|Application|Practice|Exercise|Drill|Review|Revision|Correction|Feedback|Guidance|Instruction|Teaching|Learning|Study|Research|Investigation|Exploration|Discovery|Innovation|Creativity|Imagination|Inspiration|Motivation|Encouragement|Support|Help|Assistance|Guidance|Mentorship|Coaching|Tutoring|Teaching|Instruction|Education|Training|Development|Growth|Improvement|Progress|Success|Achievement|Accomplishment|Mastery|Proficiency|Skill|Ability|Competence|Confidence|Self-Esteem|Self-Confidence|Self-Assurance|Self-Belief|Self-Trust|Self-Reliance|Independence|Autonomy|Freedom|Liberty|Choice|Option|Alternative|Possibility|Opportunity|Chance|Potential|Capability|Capacity|Power|Strength|Force|Energy|Vitality|Life|Living|Existence|Being|Presence|Awareness|Consciousness|Mind|Thought|Thinking|Reasoning|Logic|Rationality|Intelligence|Wisdom|Knowledge|Understanding|Comprehension|Insight|Perception|Awareness|Consciousness|Mindfulness|Attention|Focus|Concentration|Meditation|Reflection|Contemplation|Introspection|Self-Awareness|Self-Reflection|Self-Examination|Self-Analysis|Self-Evaluation|Self-Assessment|Self-Improvement|Self-Development|Self-Growth|Self-Transformation|Self-Realization|Self-Actualization|Self-Fulfillment|Self-Satisfaction|Self-Contentment|Self-Happiness|Self-Joy|Self-Bliss|Self-Peace|Self-Harmony|Self-Balance|Self-Equilibrium|Self-Stability|Self-Security|Self-Safety|Self-Protection|Self-Defense|Self-Preservation|Self-Survival|Self-Existence|Self-Being|Self-Presence|Self-Awareness|Self-Consciousness|Self-Mindfulness|Self-Attention|Self-Focus|Self-Concentration|Self-Meditation|Self-Reflection|Self-Contemplation|Self-Introspection|Self-Self-Awareness|Self-Self-Reflection|Self-Self-Examination|Self-Self-Analysis|Self-Self-Evaluation|Self-Self-Assessment|Self-Self-Improvement|Self-Self-Development|Self-Self-Growth|Self-Self-Transformation|Self-Self-Realization|Self-Self-Actualization|Self-Self-Fulfillment|Self-Self-Satisfaction|Self-Self-Contentment|Self-Self-Happiness|Self-Self-Joy|Self-Self-Bliss|Self-Self-Peace|Self-Self-Harmony|Self-Self-Balance|Self-Self-Equilibrium|Self-Self-Stability|Self-Self-Security|Self-Self-Safety|Self-Self-Protection|Self-Self-Defense|Self-Self-Preservation|Self-Self-Survival|Self-Self-Existence|Self-Self-Being|Self-Self-Presence|Self-Self-Awareness|Self-Self-Consciousness|Self-Self-Mindfulness|Self-Self-Attention|Self-Self-Focus|Self-Self-Concentration|Self-Self-Meditation|Self-Self-Reflection|Self-Self-Contemplation|Self-Self-Introspection|Self-Self-Self-Awareness|Self-Self-Self-Reflection|Self-Self-Self-Examination|Self-Self-Self-Analysis|Self-Self-Self-Evaluation|Self-Self-Self-Assessment|Self-Self-Self-Improvement|Self-Self-Self-Development|Self-Self-Self-Growth|Self-Self-Self-Transformation|Self-Self-Self-Realization|Self-Self-Self-Actualization|Self-Self-Self-Fulfillment|Self-Self-Self-Satisfaction|Self-Self-Self-Contentment|Self-Self-Self-Happiness|Self-Self-Self-Joy|Self-Self-Self-Bliss|Self-Self-Self-Peace|Self-Self-Self-Harmony|Self-Self-Self-Balance|Self-Self-Self-Equilibrium|Self-Self-Self-Stability|Self-Self-Self-Security|Self-Self-Self-Safety|Self-Self-Self-Protection|Self-Self-Self-Defense|Self-Self-Self-Preservation|Self-Self-Self-Survival|Self-Self-Self-Existence|Self-Self-Self-Being|Self-Self-Self-Presence|Self-Self-Self-Awareness|Self-Self-Self-Consciousness|Self-Self-Self-Mindfulness|Self-Self-Self-Attention|Self-Self-Self-Focus|Self-Self-Self-Concentration|Self-Self-Self-Meditation|Self-Self-Self-Reflection|Self-Self-Self-Contemplation|Self-Self-Self-Introspection):\s*(.+?)(?:\n|$)/gi;
  
  let match;
  while ((match = explanationPattern.exec(feedback)) !== null) {
    const category = match[1].trim();
    const explanation = match[2].trim();
    explanations[category] = explanation;
  }
  
  return explanations;
};

export const extractFormattedSentence = (feedback: string, romanizationDisplay: string): FormattedText | null => {
  // Look for patterns that might contain both original and romanized text
  const patterns = [
    // Pattern: "original (romanized)" or "original: romanized"
    /([^(]+?)\s*[(:]\s*([^)]+?)\)?$/,
    // Pattern: "romanized (original)" or "romanized: original"  
    /([^(]+?)\s*[(:]\s*([^)]+?)\)?$/,
    // Pattern: "Here's the corrected version: ..."
    /(?:here's the corrected version|corrected version):\s*(.+?)(?:\n|$)/i
  ];

  for (const pattern of patterns) {
    const match = feedback.match(pattern);
    if (match) {
      const text1 = match[1].trim();
      const text2 = match[2].trim();
      
      // Determine which is original and which is romanized based on content
      if (romanizationDisplay === 'above' || romanizationDisplay === 'below') {
        // If romanization is displayed separately, return the main text
        return { mainText: text1 };
      } else {
        // If romanization is inline, try to determine which is which
        // This is a heuristic - you might need to adjust based on your specific use case
        return { mainText: text1, romanizedText: text2 };
      }
    }
  }

  return null;
};

export const parseQuickTranslation = (translationText: string) => {
  const lines = translationText.split('\n').filter(line => line.trim());
  
  if (lines.length === 0) {
    return { translation: '', breakdown: '' };
  }

  // Look for patterns like "Translation: ..." or "Breakdown: ..."
  let translation = '';
  let breakdown = '';
  
  for (const line of lines) {
    if (line.toLowerCase().includes('translation:')) {
      translation = line.replace(/^translation:\s*/i, '').trim();
    } else if (line.toLowerCase().includes('breakdown:')) {
      breakdown = line.replace(/^breakdown:\s*/i, '').trim();
    } else if (!translation) {
      // If no explicit translation label, assume first line is translation
      translation = line;
    } else if (!breakdown) {
      // If no explicit breakdown label, assume second line is breakdown
      breakdown = line;
    }
  }

  return { translation, breakdown };
};
