// Constants and configuration for the analyze page

export const MESSAGES_PER_PAGE = 50;

export const CLOSENESS_LEVELS: { [key: string]: string } = {
  intimate: '👫 Intimate: Close friends, family, or partners',
  friendly: '😊 Friendly: Peers, classmates, or casual acquaintances',
  respectful: '🙏 Respectful: Teachers, elders, or professionals',
  formal: '🎩 Formal: Strangers, officials, or business contacts',
  distant: '🧑‍💼 Distant: Large groups, public speaking, or unknown audience',
};

export const DEFAULT_PANEL_WIDTHS = {
  left: 300,
  right: 300,
} as const;

export const TTS_TIMEOUTS = {
  autospeak: 10000, // 10 seconds for autospeak mode
  manual: 30000, // 30 seconds for manual mode
} as const;

export const AUDIO_PROCESSING_TIMEOUTS = {
  urlCheck: 6, // attempts
  urlCheckDelay: 300, // ms
} as const;

export const CACHE_KEYS = {
  tts: 'tts_cache',
  romanization: 'romanization_cache',
} as const;


