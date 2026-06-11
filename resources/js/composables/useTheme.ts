// Light/dark theme controller. State lives at module scope so every component
// that calls useTheme() shares one reactive source of truth. The `.dark` class
// on <html> is what Tailwind's dark: variants key off (see resources/css/app.css);
// toggling it re-themes the whole app instantly, no reload.
//
// First visit follows the OS (prefers-color-scheme); once the user picks a theme
// we remember it and stop following the system. Mirrors the no-flash bootstrap
// script in resources/views/app.blade.php.

import { readonly, ref } from 'vue';

export type Theme = 'light' | 'dark';

const STORAGE_KEY = 'app:theme';

function systemPrefersDark(): boolean {
    return typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches;
}

function storedTheme(): Theme | null {
    try {
        const value = localStorage.getItem(STORAGE_KEY);
        return value === 'dark' || value === 'light' ? value : null;
    } catch {
        return null;
    }
}

const theme = ref<Theme>(storedTheme() ?? (systemPrefersDark() ? 'dark' : 'light'));

function apply(value: Theme): void {
    if (typeof document === 'undefined') {
        return;
    }
    document.documentElement.classList.toggle('dark', value === 'dark');
}

let listening = false;

function startSystemListener(): void {
    if (listening || typeof window === 'undefined') {
        return;
    }
    listening = true;
    // Follow the OS only while the user hasn't made an explicit choice.
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (event) => {
        if (storedTheme() === null) {
            theme.value = event.matches ? 'dark' : 'light';
            apply(theme.value);
        }
    });
}

export function useTheme() {
    // Ensure the DOM matches the reactive state (the blade script already set the
    // class on first paint; this keeps things consistent on SPA navigations).
    apply(theme.value);
    startSystemListener();

    function setTheme(value: Theme): void {
        theme.value = value;
        try {
            localStorage.setItem(STORAGE_KEY, value);
        } catch {
            // best-effort persistence; theme still applies for this session
        }
        apply(value);
    }

    function toggle(): void {
        setTheme(theme.value === 'dark' ? 'light' : 'dark');
    }

    return {
        theme: readonly(theme),
        isDark: () => theme.value === 'dark',
        setTheme,
        toggle,
    };
}
