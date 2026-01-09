"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var vite_1 = require("vite");
var plugin_react_1 = require("@vitejs/plugin-react");
var path_1 = require("path");
exports.default = (0, vite_1.defineConfig)(function (_a) {
    var mode = _a.mode;
    var env = (0, vite_1.loadEnv)(mode, process.cwd(), '');
    return {
        plugins: [(0, plugin_react_1.default)()],
        resolve: {
            alias: {
                '@': path_1.default.resolve(__dirname, './src'),
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
