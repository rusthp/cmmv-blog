import js from "@eslint/js";
import tseslint from "typescript-eslint";
import prettier from "eslint-config-prettier";
import globals from "globals";

/**
 * Shared ESLint 9 flat config for the cmmv-blog monorepo.
 *
 * Type-aware linting is intentionally NOT enabled: it requires a tsconfig
 * project per package and is an order of magnitude slower. `tsc --noEmit`
 * (pnpm run type-check) already covers type correctness.
 */
export const ignores = [
    "**/node_modules/**",
    "**/dist/**",
    "**/build/**",
    "**/.turbo/**",
    "**/.vite/**",
    "**/coverage/**",
    "**/*.d.ts",
];

export default tseslint.config(
    { ignores },
    js.configs.recommended,
    {
        name: "cmmv/languages",
        languageOptions: {
            ecmaVersion: 2022,
            sourceType: "module",
            globals: {
                ...globals.node,
                ...globals.es2021,
            },
        },
    },
    {
        name: "cmmv/commonjs",
        files: ["**/*.cjs"],
        languageOptions: { sourceType: "commonjs" },
    },
    {
        name: "cmmv/typescript",
        files: ["**/*.ts", "**/*.tsx", "**/*.mts", "**/*.cts"],
        extends: [...tseslint.configs.recommended],
        rules: {
            // Decorator-heavy CMMV contracts declare params that the framework
            // consumes at runtime; report them without failing the build.
            "@typescript-eslint/no-unused-vars": [
                "warn",
                {
                    argsIgnorePattern: "^_",
                    varsIgnorePattern: "^_",
                    caughtErrorsIgnorePattern: "^_",
                },
            ],
            "@typescript-eslint/no-explicit-any": "warn",
        },
    },
    {
        name: "prettier",
        rules: prettier.rules,
    },
);
