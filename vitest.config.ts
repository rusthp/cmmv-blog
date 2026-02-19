import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
    test: {
        globals: true,
        environment: 'node',
        include: ['tests/**/*.{test,spec}.{ts,js}'],
        exclude: ['node_modules', 'dist', 'build'],
        coverage: {
            provider: 'v8',
            reporter: ['text', 'json', 'html', 'lcov'],
            reportsDirectory: './coverage',
            exclude: [
                'node_modules/',
                'dist/',
                'build/',
                'coverage/',
                '**/*.d.ts',
                '**/*.config.{ts,js}',
                '**/index.ts',
                'tests/',
                'apps/',
            ],
            thresholds: {
                lines: 95,
                functions: 95,
                branches: 95,
                statements: 95,
            },
            all: true,
        },
        testTimeout: 10000,
        hookTimeout: 10000,
    },
    resolve: {
        alias: {
            '@cmmv/blog': path.resolve(__dirname, './packages/plugin'),
            '@cmmv/access-control': path.resolve(__dirname, './packages/access-control'),
            '@cmmv/rss-aggregation': path.resolve(__dirname, './packages/rss-aggregation'),
            '@cmmv/ai-content': path.resolve(__dirname, './packages/ai-content'),
            '@cmmv/yt-aggregation': path.resolve(__dirname, './packages/yt-aggregation'),
            '@cmmv/affiliate': path.resolve(__dirname, './packages/affiliate'),
            '@cmmv/odds': path.resolve(__dirname, './packages/odds'),
            '@cmmv/newsletter': path.resolve(__dirname, './packages/newsletter'),
        },
    },
});

