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
      // General code style
      'array-bracket-spacing': ['error', 'never'],
      'block-spacing': ['error', 'always'],
      camelcase: 0,
      'comma-spacing': ['error', { before: false, after: true }],
      'computed-property-spacing': ['error', 'never'],
      curly: 'warn',
      'indent': ['error', 2],
      'key-spacing': ['error', { beforeColon: false, afterColon: true }],
      'keyword-spacing': ['error', { before: true, after: true }],
      'no-multi-spaces': 'error',
      'no-multiple-empty-lines': [2, { max: 2 }],
      'no-return-assign': 0,
      'object-curly-spacing': ['error', 'always'],
      'prefer-template': 'warn',
      quotes: ['error', 'single', { allowTemplateLiterals: true }],
      semi: [2, 'always'],
      'semi-spacing': ['error', { before: false, after: true }],
      'space-before-blocks': ['error', 'always'],
      'space-before-function-paren': 0, // Disabled to allow flexibility
      'space-in-parens': ['error', 'never'],
      'space-infix-ops': 'error',

      // TypeScript specific
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-namespace': 'off',
      '@typescript-eslint/no-non-null-assertion': 'off',

      // Import plugin
      'import/no-unresolved': 0,
      'import/order': [
        'warn',
        {
          groups: [
            'builtin', // Node "builtin" modules
            'external', // External modules (from node_modules)
            'internal', // Internal modules (alias, src, etc.)
            'parent', // Parent directories
            'sibling', // Sibling files
            'index', // Index file
            'type', // Type imports
            'object', // Object imports
          ],
          'newlines-between': 'always',
        },
      ],
    },
  },
]);
