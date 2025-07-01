// eslint.config.mjs
import js from '@eslint/js';
import globals from 'globals';
import eslintPluginImport from 'eslint-plugin-import';
import tseslint from 'typescript-eslint';
import { defineConfig } from 'eslint/config';

export default defineConfig([
  {
    files: ['**/*.{js,mjs,cjs,ts,mts,cts}'],
    plugins: {
      js,
      import: eslintPluginImport,
      '@typescript-eslint': tseslint.plugin,
    },
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
      globals: globals.browser,
    },
    settings: {
      'import/resolver': {
        node: true,
      },
    },
    rules: {
      'no-multiple-empty-lines': [2, { max: 2 }],
      semi: [2, 'always'],
      curly: 'warn',
      'prefer-template': 'warn',
      'space-before-function-paren': 0,
      camelcase: 0,
      'no-return-assign': 0,
      quotes: ['error', 'single', { allowTemplateLiterals: true }],
      '@typescript-eslint/no-non-null-assertion': 'off',
      '@typescript-eslint/no-namespace': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      'import/no-unresolved': 0,
      'import/order': [
        'warn',
        {
          groups: [
            'builtin',
            'external',
            'internal',
            'parent',
            'sibling',
            'index',
            'type',
            'object',
          ],
          'newlines-between': 'always',
        },
      ],
    },
  },
]);
