import { describe, it, expect, beforeEach } from 'vitest';
import { i18n, setLocale, resolveInitialLocale, STORAGE_KEY } from '@/i18n';
import { LOCALES, isSupportedLocale, localeMeta } from '@/i18n/locales';

describe('i18n locale registry', () => {
    it('ships exactly the seven requested languages', () => {
        expect(LOCALES.map((l) => l.code)).toEqual(['en', 'nb', 'uk', 'ur', 'fr', 'bn', 'cy']);
    });

    it('marks only Urdu as right-to-left', () => {
        for (const locale of LOCALES) {
            expect(locale.dir).toBe(locale.code === 'ur' ? 'rtl' : 'ltr');
        }
    });

    it('every locale carries a flag and a native name', () => {
        for (const locale of LOCALES) {
            expect(locale.flag.length).toBeGreaterThan(0);
            expect(locale.name.length).toBeGreaterThan(0);
        }
    });

    it('falls back to the default for unknown codes', () => {
        expect(isSupportedLocale('xx')).toBe(false);
        expect(localeMeta('xx').code).toBe('en');
    });
});

describe('setLocale', () => {
    beforeEach(() => {
        localStorage.clear();
        setLocale('en');
    });

    it('switches the active language and persists the choice', () => {
        setLocale('fr');

        expect(i18n.global.locale.value).toBe('fr');
        expect(localStorage.getItem(STORAGE_KEY)).toBe('fr');
    });

    it('applies dir="rtl" and lang on the document for Urdu', () => {
        setLocale('ur');

        expect(document.documentElement.lang).toBe('ur');
        expect(document.documentElement.dir).toBe('rtl');
    });

    it('returns the document to LTR when leaving Urdu', () => {
        setLocale('ur');
        setLocale('nb');

        expect(document.documentElement.dir).toBe('ltr');
        expect(document.documentElement.lang).toBe('nb');
    });

    it('ignores unsupported codes and falls back to English', () => {
        setLocale('zz');

        expect(i18n.global.locale.value).toBe('en');
    });
});

describe('resolveInitialLocale', () => {
    beforeEach(() => localStorage.clear());

    it('prefers a previously saved, supported locale', () => {
        localStorage.setItem(STORAGE_KEY, 'bn');
        expect(resolveInitialLocale()).toBe('bn');
    });

    it('ignores a saved locale we no longer support', () => {
        localStorage.setItem(STORAGE_KEY, 'zz');
        // Falls through to browser/default; in happy-dom that resolves to English.
        expect(isSupportedLocale(resolveInitialLocale())).toBe(true);
    });
});
