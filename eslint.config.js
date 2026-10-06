import js from '@eslint/js';
import { defineConfig, globalIgnores } from 'eslint/config';
import tseslint from 'typescript-eslint';

export default defineConfig([
  globalIgnores(['**/dist/']),
  js.configs.recommended,
  tseslint.configs.strictTypeChecked,
  {
    languageOptions: {
      parserOptions: { projectService: true },
    },
  },
  {
    files: ['**/*.js'],
    extends: [tseslint.configs.disableTypeChecked],
  },
  {
    rules: {
      complexity: ['error', 10],
      'max-depth': ['error', 2],
      'max-lines-per-function': ['error', { max: 30, skipBlankLines: true, skipComments: true }],
    },
  },
  {
    // A describe block groups many short cases, so its length says nothing about readability.
    files: ['**/*.test.ts'],
    rules: { 'max-lines-per-function': 'off' },
  },
  {
    files: ['games/**'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['slot-sdk/*', '!slot-sdk/vite', '**/packages/**'],
              message: 'Games use the SDK only through its public entry point "slot-sdk".',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['packages/**'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['**/games/**'],
              message: 'The SDK must not depend on a specific game.',
            },
          ],
        },
      ],
    },
  },
]);
