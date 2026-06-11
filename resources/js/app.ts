import '../css/app.css';

import { createApp, h, type DefineComponent } from 'vue';
import { createInertiaApp } from '@inertiajs/vue3';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { i18n, resolveInitialLocale, setLocale } from './i18n';

const appName = import.meta.env.VITE_APP_NAME ?? 'Claude Demo';

// Sync <html> lang/dir with the saved/detected locale before the app mounts.
setLocale(resolveInitialLocale());

createInertiaApp({
    title: (title) => (title ? `${title} — ${appName}` : appName),
    // Pages live in resources/js/Pages and are code-split: Vite emits one chunk
    // per page, loaded on demand as you navigate.
    resolve: (name) =>
        resolvePageComponent(
            `./Pages/${name}.vue`,
            import.meta.glob<DefineComponent>('./Pages/**/*.vue'),
        ),
    setup({ el, App, props, plugin }) {
        createApp({ render: () => h(App, props) })
            .use(plugin)
            .use(i18n)
            .mount(el);
    },
    // The thin loading bar shown during Inertia visits.
    progress: {
        color: '#0ea5e9',
    },
});
