// The single source of truth for which languages the app speaks. Each entry
// drives the language selector (flag + native name) and the document direction
// (Urdu reads right-to-left). Add a language here + a matching messages file in
// ./messages and it shows up everywhere automatically.

export type Direction = 'ltr' | 'rtl';

export interface LocaleMeta {
    /** BCP-47 code, also used as the <html lang> value. */
    code: string;
    /** Endonym — the language's name in its own language. */
    name: string;
    /** Emoji flag shown in the selector. */
    flag: string;
    /** Text direction; only Urdu is RTL here. */
    dir: Direction;
}

export const LOCALES: LocaleMeta[] = [
    { code: 'en', name: 'English', flag: '🇬🇧', dir: 'ltr' },
    { code: 'nb', name: 'Norsk', flag: '🇳🇴', dir: 'ltr' },
    { code: 'uk', name: 'Українська', flag: '🇺🇦', dir: 'ltr' },
    { code: 'ur', name: 'اردو', flag: '🇵🇰', dir: 'rtl' },
    { code: 'fr', name: 'Français', flag: '🇫🇷', dir: 'ltr' },
    { code: 'bn', name: 'বাংলা', flag: '🇧🇩', dir: 'ltr' },
    // The Welsh flag emoji (🏴 gb-wls) renders only on Apple platforms; the
    // native name beside it keeps the option legible everywhere else.
    { code: 'cy', name: 'Cymraeg', flag: '🏴󠁧󠁢󠁷󠁬󠁳󠁿', dir: 'ltr' },
];

export const DEFAULT_LOCALE = 'en';

const KNOWN = new Set(LOCALES.map((l) => l.code));

/** Look up a locale's metadata, falling back to the default. */
export function localeMeta(code: string): LocaleMeta {
    return LOCALES.find((l) => l.code === code) ?? LOCALES[0];
}

/** True when `code` is a language we actually ship messages for. */
export function isSupportedLocale(code: string): boolean {
    return KNOWN.has(code);
}
