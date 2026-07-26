import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import importSort from 'eslint-plugin-simple-import-sort';
import prettier from 'eslint-plugin-prettier';

const ignoredPaths = [
    '**/*/coverage/**/*',
    '**/*/build/**/*',
    '**/*/es/**/*',
    '**/*/dist/**/*',
    '**/.vite/**/*'
];

const typedTsFiles = tseslint.config({
    files: ['**/*.{ts,tsx}'],
    ignores: [
        ...ignoredPaths,
        'apps/server/app/generated/**/*',
        'apps/desktop/forge.config.ts',
        'apps/desktop/vite.*.config.ts',
        'apps/desktop/vitest.config.mts'
    ],
    rules: {
        '@typescript-eslint/array-type': 'error',
        '@typescript-eslint/no-for-in-array': 'error',
        '@typescript-eslint/no-explicit-any': 'off',
        'no-undef': 'warn',
        'no-console': 'error',
        'simple-import-sort/imports': [
            'error',
            {
                groups: [
                    ['^\\w'],
                    ['^@\\w'],
                    ['^@/'],
                    ['^\\u0000'],
                    ['^\\.\\.(?!/?$)', '^\\.\\./?$'],
                    ['^\\./(?=.*/)(?!/?$)', '^\\.(?!/?$)', '^\\./?$']
                ]
            }
        ],
        'simple-import-sort/exports': 'error',
        'prettier/prettier': 'error'
    },
    languageOptions: {
        parser: tseslint.parser,
        globals: {
            ...globals.browser,
            ...globals.node,
            MAIN_WINDOW_VITE_DEV_SERVER_URL: 'readonly',
            MAIN_WINDOW_VITE_NAME: 'readonly',
            magicutAPI: 'readonly'
        },
        parserOptions: {
            project: ['**/*/tsconfig.json'],
            tsconfigRootDir: import.meta.dirname
        }
    },
    plugins: { 'simple-import-sort': importSort, prettier }
});

const configFiles = tseslint.config({
    files: ['apps/desktop/*config.ts', 'apps/desktop/vitest.config.mts'],
    languageOptions: {
        parser: tseslint.parser,
        globals: {
            ...globals.node
        }
    },
    rules: {
        'no-console': 'error',
        'prettier/prettier': 'error'
    },
    plugins: { prettier }
});

export default tseslint.config(
    {
        extends: [js.configs.recommended, ...tseslint.configs.recommended],
        languageOptions: {
            globals: {
                ...globals.browser,
                ...globals.node
            }
        }
    },
    { ignores: ignoredPaths },
    typedTsFiles,
    configFiles
);
