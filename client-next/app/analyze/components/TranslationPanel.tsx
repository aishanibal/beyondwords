import React from 'react';
import { TranslationData } from '../types/analyze';

interface TranslationPanelProps {
  translation: TranslationData | undefined;
  isTranslating: boolean;
  showTranslation: boolean;
  onToggleTranslation: () => void;
  onTranslateMessage: (breakdown?: boolean) => void;
  isDarkMode: boolean;
}

export default function TranslationPanel({
  translation,
  isTranslating,
  showTranslation,
  onToggleTranslation,
  onTranslateMessage,
  isDarkMode,
}: TranslationPanelProps) {
  if (!translation && !isTranslating) {
    return (
      <div className="mt-2">
        <button
          onClick={() => onTranslateMessage()}
          className={`px-3 py-1 text-sm rounded transition-colors ${
            isDarkMode
              ? 'bg-gray-700 hover:bg-gray-600 text-gray-300'
              : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
          }`}
        >
          Translate
        </button>
      </div>
    );
  }

  return (
    <div className="mt-2">
      <div className="flex items-center justify-between mb-2">
        <button
          onClick={onToggleTranslation}
          className={`px-3 py-1 text-sm rounded transition-colors ${
            isDarkMode
              ? 'bg-gray-700 hover:bg-gray-600 text-gray-300'
              : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
          }`}
        >
          {showTranslation ? 'Hide Translation' : 'Show Translation'}
        </button>
        
        {translation?.has_breakdown && (
          <button
            onClick={() => onTranslateMessage(true)}
            className={`px-3 py-1 text-sm rounded transition-colors ${
              isDarkMode
                ? 'bg-blue-700 hover:bg-blue-600 text-blue-300'
                : 'bg-blue-200 hover:bg-blue-300 text-blue-700'
            }`}
          >
            Breakdown
          </button>
        )}
      </div>

      {isTranslating && (
        <div className={`p-3 rounded ${
          isDarkMode ? 'bg-gray-800' : 'bg-gray-100'
        }`}>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              Translating...
            </span>
          </div>
        </div>
      )}

      {showTranslation && translation && (
        <div className={`p-3 rounded ${
          isDarkMode ? 'bg-gray-800' : 'bg-gray-100'
        }`}>
          {translation.translation && (
            <div className="mb-2">
              <h4 className={`text-sm font-medium mb-1 ${
                isDarkMode ? 'text-gray-200' : 'text-gray-700'
              }`}>
                Translation:
              </h4>
              <p className={`text-sm ${
                isDarkMode ? 'text-gray-300' : 'text-gray-600'
              }`}>
                {translation.translation}
              </p>
            </div>
          )}
          
          {translation.breakdown && (
            <div>
              <h4 className={`text-sm font-medium mb-1 ${
                isDarkMode ? 'text-gray-200' : 'text-gray-700'
              }`}>
                Breakdown:
              </h4>
              <p className={`text-sm ${
                isDarkMode ? 'text-gray-300' : 'text-gray-600'
              }`}>
                {translation.breakdown}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
