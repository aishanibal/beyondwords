import Kuroshiro from 'kuroshiro';
import KuromojiAnalyzer from 'kuroshiro-analyzer-kuromoji';
import pinyin from 'pinyin';
import { pinyin as pinyinPro } from 'pinyin-pro';
import { transliterate } from 'transliteration';
import * as wanakana from 'wanakana';
import { convert as romanizeHangul } from 'hangul-romanization';
import Sanscript from '@indic-transliteration/sanscript';
import { SCRIPT_LANGUAGES } from '../types/analyze';

// Kuroshiro singleton with explicit Kuromoji dict path served from /public
let kuroshiroSingleton: Kuroshiro | null = null;
let kuroshiroInitPromise: Promise<Kuroshiro> | null = null;

export const getKuroshiroInstance = async (): Promise<Kuroshiro> => {
  if (kuroshiroSingleton) return kuroshiroSingleton;
  if (!kuroshiroInitPromise) {
    kuroshiroInitPromise = (async () => {
      const instance = new Kuroshiro();
      // Ensure the Kuromoji dictionary is fetched from the public path
      await instance.init(new KuromojiAnalyzer({ dictPath: '/kuromoji/dict' } as any));
      kuroshiroSingleton = instance;
      return instance;
    })();
  }
  return kuroshiroInitPromise;
};

export const fixRomanizationPunctuation = (input: string): string => {
  return input
    .replace(/\s*([,.!?;:])/g, '$1') // Remove spaces before punctuation
    .replace(/([,.!?;:])\s+/g, '$1 ') // Ensure single space after punctuation
    .replace(/\s+/g, ' ') // Replace multiple spaces with single space
    .trim();
};

export const isScriptLanguage = (languageCode: string): boolean => {
  return languageCode in SCRIPT_LANGUAGES;
};

export const formatScriptLanguageText = (text: string, languageCode: string): { mainText: string; romanizedText?: string } => {
  // Safety check for undefined or null text
  if (!text || typeof text !== 'string') {
    return { mainText: '' };
  }
  
  // Check if the text already contains romanization in the format "romanization (original)"
  const romanizationPattern = /^(.+?)\s*\(([^)]+)\)$/;
  const match = text.match(romanizationPattern);
  
  if (match) {
    return { mainText: match[2].trim(), romanizedText: match[1].trim() };
  }
  
  // If it's a script language but doesn't have romanization, return as is
  // The AI should handle the formatting, but this is a fallback
  return { mainText: text };
};

// Enhanced Japanese romanization with comprehensive debug information
export const generateRomanizedText = async (text: string, languageCode: string): Promise<string> => {
  if (!isScriptLanguage(languageCode)) {
    return text;
  }

  try {
    let romanizedText = '';

    switch (languageCode) {
      case 'ja': {
        // Japanese romanization using Kuroshiro
        const kuroshiro = await getKuroshiroInstance();
        const result = await kuroshiro.convert(text, {
          to: 'romaji',
          mode: 'spaced'
        });
        romanizedText = fixRomanizationPunctuation(result);
        break;
      }
      case 'ko': {
        // Korean romanization using hangul-romanization
        romanizedText = romanizeHangul(text);
        break;
      }
      case 'zh': {
        // Chinese romanization using pinyin-pro with tone marks
        try {
          romanizedText = pinyinPro(text, { toneType: 'symbol' });
        } catch (error) {
          console.warn('pinyin-pro failed, falling back to pinyin:', error);
          romanizedText = pinyin(text, { style: pinyin.STYLE_TONE }).join(' ');
        }
        break;
      }
      case 'hi': {
        // Hindi romanization using Sanscript
        romanizedText = Sanscript.t(text, 'devanagari', 'iast');
        break;
      }
      case 'ar': {
        // Arabic romanization using transliteration
        romanizedText = transliterate(text);
        break;
      }
      case 'th': {
        // Thai romanization using transliteration
        romanizedText = transliterate(text);
        break;
      }
      case 'ru': {
        // Russian romanization using transliteration
        romanizedText = transliterate(text);
        break;
      }
      case 'el': {
        // Greek romanization using transliteration
        romanizedText = transliterate(text);
        break;
      }
      case 'he': {
        // Hebrew romanization using transliteration
        romanizedText = transliterate(text);
        break;
      }
      default: {
        // For other script languages, try transliteration as fallback
        romanizedText = transliterate(text);
        break;
      }
    }

    return romanizedText;
  } catch (error) {
    console.error(`Error romanizing text for language ${languageCode}:`, error);
    return text; // Return original text if romanization fails
  }
};
