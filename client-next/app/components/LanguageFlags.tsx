"use client";

import { motion, useAnimationFrame } from "framer-motion";
import { useRef } from "react";
import { useDarkMode } from "../contexts/DarkModeContext";

type Language = {
  code: string;
  label: string;
  flag: string;
  description: string;
};

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
  // Additional Script Languages
  { code: 'th', label: 'Thai', flag: '🇹🇭', description: 'ฝึกภาษาไทยกับ AI' },
  { code: 'bn', label: 'Bengali', flag: '🇧🇩', description: 'AI দিয়ে বাংলা অনুশীলন করুন' },
  { code: 'pa', label: 'Punjabi', flag: '🇮🇳', description: 'AI ਨਾਲ ਪੰਜਾਬੀ ਦਾ ਅਭਿਆਸ ਕਰੋ' },
  { code: 'gu', label: 'Gujarati', flag: '🇮🇳', description: 'AI સાથે ગુજરાતીનો અભ્યાસ કરો' },
  { code: 'mr', label: 'Marathi', flag: '🇮🇳', description: 'AI सह मराठीचा सराव करा' },
  { code: 'kn', label: 'Kannada', flag: '🇮🇳', description: 'AI ಜೊತೆ ಕನ್ನಡ ಅಭ್ಯಾಸ ಮಾಡಿ' },
  { code: 'te', label: 'Telugu', flag: '🇮🇳', description: 'AI తో తెలుగు అభ్యాసం చేయండి' },
  { code: 'ar', label: 'Arabic', flag: '🇸🇦', description: 'تدرب على العربية مع الذكاء الاصطناعي' },
];

// Duplicate once for seamless loop
const looped = [...LANGUAGES, ...LANGUAGES];

export default function LanguageFlags() {
  const { isDarkMode } = useDarkMode();
  const containerRef = useRef<HTMLDivElement>(null);
  const x = useRef(0);
  const speed = 1.0; // Adjust for scroll speed

  useAnimationFrame((_, delta) => {
    if (containerRef.current) {
      x.current -= (speed * delta) / 16; // Normalize for frame rate
      const containerWidth = containerRef.current.scrollWidth / 2;
      if (Math.abs(x.current) >= containerWidth) {
        x.current = 0;
      }
      containerRef.current.style.transform = `translateX(${x.current}px)`;
    }
  });

  return (
    <section className={`py-12 ${isDarkMode ? 'bg-gray-900/50' : 'bg-white/50'} overflow-hidden`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Heading */}
        <div className="text-center mb-8">
          <h3 className={`text-4xl font-heading font-semibold ${isDarkMode ? 'text-light-purple' : 'text-rose-primary'} mb-2`}>
            Supporting Heritage Languages Worldwide
          </h3>
        </div>

        {/* Seamless Looping Carousel */}
        <div className="relative w-full overflow-hidden">
          <div
            ref={containerRef}
            className="flex gap-16 items-center whitespace-nowrap will-change-transform"
          >
            {looped.map((lang, index) => (
              <div
                key={`${lang.code}-${index}`}
                className="flex-shrink-0 flex flex-col items-center text-center min-w-[160px] max-w-[200px]"
              >
                <div className="text-4xl sm:text-5xl">{lang.flag}</div>
                <div className={`mt-1 text-sm font-semibold ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>{lang.label}</div>
                <div className={`text-xs sm:text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} break-words leading-tight`}>
                  {lang.description}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
