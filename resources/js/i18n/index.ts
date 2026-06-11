// vue-i18n setup. One instance, Composition API mode, with English as the
// fallback so a missing key in any language degrades to English rather than
// showing a raw key path. `setLocale()` is the single entry point for changing
// language: it updates the active locale, persists the choice, and syncs the
// <html> lang/dir attributes (the latter is what flips the layout to RTL for
// Urdu) — all without a page reload.

import { createI18n } from 'vue-i18n';
import { DEFAULT_LOCALE, isSupportedLocale, localeMeta } from './locales';

import en from './messages/en.json';
import nb from './messages/nb.json';
import uk from './messages/uk.json';
import ur from './messages/ur.json';
import fr from './messages/fr.json';
import bn from './messages/bn.json';
import cy from './messages/cy.json';

export const STORAGE_KEY = 'app:locale';

const messages = { en, nb, uk, ur, fr, bn, cy };

/**
 * Decide which language to start in: a previously saved choice wins, otherwise
 * the closest match to the browser's preferred languages, otherwise English.
 * Kept defensive so it never throws in private-mode / no-storage environments.
 */
export function resolveInitialLocale(): string {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved && isSupportedLocale(saved)) {
            return saved;
        }
    } catch {
        // localStorage unavailable — fall through to browser detection.
    }

    const candidates = typeof navigator !== 'undefined' ? navigator.languages ?? [navigator.language] : [];
    for (const lang of candidates) {
        const base = lang?.toLowerCase().split('-')[0];
        if (base && isSupportedLocale(base)) {
            return base;
        }
    }

    return DEFAULT_LOCALE;
}

export const i18n = createI18n({
    legacy: false,
    locale: resolveInitialLocale(),
    fallbackLocale: DEFAULT_LOCALE,
    messages,
});

/** Reflect the active locale onto the document for a11y + RTL. */
function applyDocumentLocale(code: string): void {
    if (typeof document === 'undefined') {
        return;
    }
    const meta = localeMeta(code);
    document.documentElement.lang = meta.code;
    document.documentElement.dir = meta.dir;
}

/**
 * Change the app language live. Safe to call at startup (to sync the document)
 * and on every selector change.
 */
export function setLocale(code: string): void {
    const next = isSupportedLocale(code) ? code : DEFAULT_LOCALE;

    // i18n.global.locale is a ref in Composition mode. vue-i18n narrows its type
    // to the union of known locale keys; `next` is validated above, so cast.
    i18n.global.locale.value = next as typeof i18n.global.locale.value;

    try {
        localStorage.setItem(STORAGE_KEY, next);
    } catch {
        // Persistence is best-effort; the language still changes for this session.
    }

    applyDocumentLocale(next);
}
