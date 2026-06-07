import { defineConfig } from 'vitest/config';
import vue from '@vitejs/plugin-vue';
import { resolve } from 'node:path';

// Vitest runs our Vue component tests in a lightweight DOM (happy-dom) without
// needing a browser. The `@` alias mirrors vite.config.ts / tsconfig.json so
// component imports resolve identically in tests and in the app.
export default defineConfig({
    plugins: [vue()],
    resolve: {
        alias: {
            '@': resolve(__dirname, 'resources/js'),
        },
    },
    test: {
        environment: 'happy-dom',
        globals: true,
        setupFiles: ['./tests/frontend/setup.ts'],
        include: ['tests/frontend/**/*.{test,spec}.ts'],
        coverage: {
            provider: 'v8',
            reporter: ['text', 'html'],
            include: ['resources/js/Components/**'],
        },
    },
});
