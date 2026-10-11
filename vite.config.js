import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
export default defineConfig(function (_a) {
    var mode = _a.mode;
    var env = loadEnv(mode, process.cwd(), '');
    return {
        plugins: [react()],
        resolve: {
            alias: {
                '@': path.resolve(__dirname, './src'),
            },
        },
        server: {
            port: 3000,
            host: true,
            proxy: {
                '/api': {
                    target: env.VITE_API_URL || 'http://localhost:3001',
                    changeOrigin: true,
                }
            }
        },
        define: {
            'process.env.VITE_API_URL': JSON.stringify(env.VITE_API_URL)
        }
    };
});
