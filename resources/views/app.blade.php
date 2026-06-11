<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}" class="h-full">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">

    {{-- Apply the saved language direction and colour theme before first paint,
         so Urdu doesn't flash LTR and dark mode doesn't flash light. Mirrors the
         logic in resources/js/i18n (app:locale) and composables/useTheme (app:theme). --}}
    <script>
        (function () {
            try {
                var root = document.documentElement;
                var locale = localStorage.getItem('app:locale');
                if (locale) {
                    root.lang = locale;
                    root.dir = locale === 'ur' ? 'rtl' : 'ltr';
                }
                var theme = localStorage.getItem('app:theme');
                var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                if (theme === 'dark' || (theme === null && prefersDark)) {
                    root.classList.add('dark');
                }
            } catch (e) { /* storage blocked — fall back to server defaults */ }
        })();
    </script>

    {{-- Inertia keeps this <title> in sync via the `title` callback in app.ts. --}}
    <title inertia>{{ config('app.name', 'Claude Demo') }}</title>

    {{-- Vite injects the hashed asset tags (and the HMR client in dev). The
         entry is app.ts; @vite also pulls in the compiled Tailwind CSS. --}}
    @vite(['resources/css/app.css', 'resources/js/app.ts'])
    @inertiaHead
</head>
<body class="h-full antialiased">
    @inertia
</body>
</html>
