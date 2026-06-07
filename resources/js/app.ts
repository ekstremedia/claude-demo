import '../css/app.css';

import { createApp, h, type DefineComponent } from 'vue';
import { createInertiaApp } from '@inertiajs/vue3';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';

const appName = import.meta.env.VITE_APP_NAME ?? 'Claude Demo';

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
            .mount(el);
    },
    // The thin loading bar shown during Inertia visits.
    progress: {
        color: '#6366f1',
    },
});
