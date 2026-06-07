import { defineConfig, loadEnv } from 'vite';
import laravel from 'laravel-vite-plugin';
import vue from '@vitejs/plugin-vue';
import tailwindcss from '@tailwindcss/vite';
import { resolve } from 'node:path';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd(), '');

    // Vite listens on this port inside the container AND it's the port the
    // browser loads assets/HMR from, so docker-compose publishes it 1:1.
    const vitePort = Number(env.VITE_HOST_PORT) || 5173;
    // Browser-facing host for the HMR websocket. `localhost` needs no host edits.
    const devServerHost = env.VITE_DEV_SERVER_HOST || 'localhost';

    return {
        plugins: [
            laravel({
                input: ['resources/css/app.css', 'resources/js/app.ts'],
                refresh: true,
            }),
            vue({
                template: {
                    transformAssetUrls: {
                        base: null,
                        includeAbsolute: false,
                    },
                },
            }),
            tailwindcss(),
        ],
        resolve: {
            alias: {
                '@': resolve(__dirname, 'resources/js'),
            },
        },
        server: {
            // Bind to all interfaces so the published Docker port reaches Vite.
            host: '0.0.0.0',
            port: vitePort,
            // Fail loudly if the port is taken — the host port is mapped 1:1, so
            // a drifted port would serve assets the browser can't reach.
            strictPort: true,
            hmr: {
                host: devServerHost,
                clientPort: vitePort,
            },
            watch: {
                ignored: ['**/storage/framework/views/**'],
                // Docker bind mounts on macOS/Windows don't reliably deliver
                // native FS events, so poll to keep HMR dependable.
                usePolling: true,
                interval: 300,
            },
        },
    };
});
