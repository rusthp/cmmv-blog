import { loadEnv } from 'vite';
import path from 'node:path';

const mode = process.env.MODE || 'production';
const env = loadEnv(mode, process.cwd(), '');

export const serverConfig = {
    mode,
    port: env.VITE_PORT || '5002',
    host: '0.0.0.0',
    apiUrl: env.VITE_API_URL || 'http://localhost:5000',
    allowedHosts: env.VITE_ALLOWED_HOSTS || 'blog.cmmv.io',
    staticDir: path.resolve('dist'),

    whitelabel: {
        maxRetries: 10,
        timeout: 5000,
        baseDelay: 2000,
        maxDelay: 10000,
        backoffMultiplier: 1.5
    },

    proxy: {
        changeOrigin: true,
        secure: false,
        timeout: 30000,
        proxyTimeout: 30000,
        headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'CMMV-Admin-Server/1.0'
        }
    }
};

export default serverConfig;
