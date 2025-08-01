import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import laravel from 'laravel-vite-plugin';
import { resolve } from 'node:path';
import { defineConfig } from 'vite';

export default defineConfig({
    base: '/build/',
    plugins: [
        laravel({
            input: [
                'resources/js/app.tsx',
                'resources/js/pages/dashboard.tsx',
                'resources/js/pages/welcome.tsx',
                'resources/js/pages/league.tsx',
                'resources/js/pages/league-join.tsx',
            ],
            ssr: 'resources/js/ssr.tsx',
            refresh: true,
        }),
        react(),
        tailwindcss(),
    ],
    esbuild: {
        jsx: 'automatic',
    },
    resolve: {
        alias: {
            'ziggy-js': resolve(__dirname, 'vendor/tightenco/ziggy'),
        },
    },
});
