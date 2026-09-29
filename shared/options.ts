export const MINUTES = [5, 10, 15, 20] as const;
export type InterviewMinutes = (typeof MINUTES)[number];

export const DEFAULT_VOICE = 'Callirrhoe';
export const DEFAULT_LANGUAGE = 'en-US';
export const DEFAULT_MINUTES: InterviewMinutes = 10;
export const REQUIRED_MODEL = 'gemini-3.8-live';
/** The model may not end via end_interview before this fraction of the setup duration. */
export const END_INTERVIEW_MIN_ELAPSED_RATIO = 0.8;

export const AVATARS = [{ id: 'Ben', label: 'Ben' }] as const;

export const VOICES = [
  { name: 'Callirrhoe', displayName: 'Alex' },
  { name: 'Zephyr', displayName: 'Maya' },
  { name: 'Puck', displayName: 'Jamie' },
  { name: 'Charon', displayName: 'Morgan' },
  { name: 'Kore', displayName: 'Taylor' },
  { name: 'Fenrir', displayName: 'Casey' },
  { name: 'Leda', displayName: 'Riley' },
  { name: 'Orus', displayName: 'Jordan' },
  { name: 'Aoede', displayName: 'Skyler' },
  { name: 'Autonoe', displayName: 'Avery' },
  { name: 'Enceladus', displayName: 'Quinn' },
  { name: 'Iapetus', displayName: 'Drew' },
  { name: 'Umbriel', displayName: 'Sam' },
  { name: 'Algieba', displayName: 'Harper' },
  { name: 'Despina', displayName: 'Sage' },
  { name: 'Erinome', displayName: 'Reese' },
  { name: 'Algenib', displayName: 'Blake' },
  { name: 'Rasalgethi', displayName: 'Cameron' },
  { name: 'Laomedeia', displayName: 'Peyton' },
  { name: 'Achernar', displayName: 'Robin' },
  { name: 'Alnilam', displayName: 'Emerson' },
  { name: 'Schedar', displayName: 'Parker' },
  { name: 'Gacrux', displayName: 'Ellis' },
  { name: 'Pulcherrima', displayName: 'Rowan' },
  { name: 'Achird', displayName: 'Finley' },
  { name: 'Zubenelgenubi', displayName: 'Dakota' },
  { name: 'Vindemiatrix', displayName: 'Kendall' },
  { name: 'Sadachbia', displayName: 'River' },
  { name: 'Sadaltager', displayName: 'Hayden' },
  { name: 'Sulafat', displayName: 'Micah' },
] as const;

export const LANGUAGES = [
  { code: 'en-US', name: 'English' },
  { code: 'af', name: 'Afrikaans' },
  { code: 'sq', name: 'Albanian' },
  { code: 'am', name: 'Amharic' },
  { code: 'ar', name: 'Arabic' },
  { code: 'hy', name: 'Armenian' },
  { code: 'as', name: 'Assamese' },
  { code: 'az', name: 'Azerbaijani' },
  { code: 'eu', name: 'Basque' },
  { code: 'be', name: 'Belarusian' },
  { code: 'bn', name: 'Bengali' },
  { code: 'bs', name: 'Bosnian' },
  { code: 'bg', name: 'Bulgarian' },
  { code: 'ca', name: 'Catalan' },
  { code: 'ceb', name: 'Cebuano' },
  { code: 'zh', name: 'Chinese' },
  { code: 'hr', name: 'Croatian' },
  { code: 'cs', name: 'Czech' },
  { code: 'da', name: 'Danish' },
  { code: 'nl', name: 'Dutch' },
  { code: 'et', name: 'Estonian' },
  { code: 'fil', name: 'Filipino (Tagalog)' },
  { code: 'fi', name: 'Finnish' },
  { code: 'fr', name: 'French' },
  { code: 'gl', name: 'Galician' },
  { code: 'ka', name: 'Georgian' },
  { code: 'de', name: 'German' },
  { code: 'el', name: 'Greek' },
  { code: 'gu', name: 'Gujarati' },
  { code: 'ht', name: 'Haitian Creole' },
  { code: 'ha', name: 'Hausa' },
  { code: 'haw', name: 'Hawaiian' },
  { code: 'iw', name: 'Hebrew' },
  { code: 'hi', name: 'Hindi' },
  { code: 'hmn', name: 'Hmong' },
  { code: 'hu', name: 'Hungarian' },
  { code: 'is', name: 'Icelandic' },
  { code: 'ig', name: 'Igbo' },
  { code: 'id', name: 'Indonesian' },
  { code: 'ga', name: 'Irish' },
  { code: 'it', name: 'Italian' },
  { code: 'ja', name: 'Japanese' },
  { code: 'jv', name: 'Javanese' },
  { code: 'kn', name: 'Kannada' },
  { code: 'kk', name: 'Kazakh' },
  { code: 'km', name: 'Khmer' },
  { code: 'ko', name: 'Korean' },
  { code: 'ku', name: 'Kurdish' },
  { code: 'ky', name: 'Kyrgyz' },
  { code: 'lo', name: 'Lao' },
  { code: 'la', name: 'Latin' },
  { code: 'lv', name: 'Latvian' },
  { code: 'lt', name: 'Lithuanian' },
  { code: 'mk', name: 'Macedonian' },
  { code: 'mg', name: 'Malagasy' },
  { code: 'ms', name: 'Malay' },
  { code: 'ml', name: 'Malayalam' },
  { code: 'mt', name: 'Maltese' },
  { code: 'mi', name: 'Maori' },
  { code: 'mr', name: 'Marathi' },
  { code: 'mn', name: 'Mongolian' },
  { code: 'my', name: 'Myanmar (Burmese)' },
  { code: 'ne', name: 'Nepali' },
  { code: 'no', name: 'Norwegian' },
  { code: 'or', name: 'Odia (Oriya)' },
  { code: 'ps', name: 'Pashto' },
  { code: 'fa', name: 'Persian' },
  { code: 'pl', name: 'Polish' },
  { code: 'pt', name: 'Portuguese' },
  { code: 'pa', name: 'Punjabi' },
  { code: 'ro', name: 'Romanian' },
  { code: 'ru', name: 'Russian' },
  { code: 'sm', name: 'Samoan' },
  { code: 'sr', name: 'Serbian' },
  { code: 'sn', name: 'Shona' },
  { code: 'sd', name: 'Sindhi' },
  { code: 'si', name: 'Sinhala (Sinhalese)' },
  { code: 'sk', name: 'Slovak' },
  { code: 'sl', name: 'Slovenian' },
  { code: 'so', name: 'Somali' },
  { code: 'es', name: 'Spanish' },
  { code: 'su', name: 'Sundanese' },
  { code: 'sw', name: 'Swahili' },
  { code: 'sv', name: 'Swedish' },
  { code: 'tg', name: 'Tajik' },
  { code: 'ta', name: 'Tamil' },
  { code: 'te', name: 'Telugu' },
  { code: 'th', name: 'Thai' },
  { code: 'tr', name: 'Turkish' },
  { code: 'uk', name: 'Ukrainian' },
  { code: 'ur', name: 'Urdu' },
  { code: 'ug', name: 'Uyghur' },
  { code: 'uz', name: 'Uzbek' },
  { code: 'vi', name: 'Vietnamese' },
  { code: 'cy', name: 'Welsh' },
  { code: 'xh', name: 'Xhosa' },
  { code: 'yi', name: 'Yiddish' },
  { code: 'yo', name: 'Yoruba' },
  { code: 'zu', name: 'Zulu' },
] as const;

export const VOICE_NAMES: ReadonlySet<string> = new Set(VOICES.map((v) => v.name));
export const LANGUAGE_CODES: ReadonlySet<string> = new Set(LANGUAGES.map((l) => l.code));
export const AVATAR_IDS: ReadonlySet<string> = new Set(AVATARS.map((a) => a.id));
export const MINUTES_SET: ReadonlySet<number> = new Set(MINUTES);

export type SessionRequest = {
  username: string;
  password: string;
  jobDescription: string;
  voiceName: string;
  language: string;
  minutes: InterviewMinutes;
  avatarName: string;
};
