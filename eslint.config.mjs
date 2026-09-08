import config from "@repo/eslint-config";

/**
 * Root flat config for the monorepo.
 *
 * ESLint 9 resolves the config by walking up from the current working
 * directory, so every workspace (apps/*, packages/*) inherits this file
 * when turbo runs `eslint .` inside the package folder.
 */
export default [
    {
        ignores: [
            "**/node_modules/**",
            "**/dist/**",
            "**/build/**",
            "**/.turbo/**",
            "**/.vite/**",
            "**/.generated/**",
            "**/coverage/**",
            "**/*.d.ts",
            "apps/web/public/**",
            "apps/admin/public/**",
        ],
    },
    ...config,
];
