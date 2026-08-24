import parser from '@typescript-eslint/parser';

export default [
  {
    ignores: ['dist/**', 'coverage/**', 'node_modules/**'],
  },
  {
    files: ['**/*.{js,mjs,cjs,ts,mts,cts,tsx}'],
    languageOptions: {
      ecmaVersion: 'latest',
      parser,
      sourceType: 'module',
    },
    rules: {
      'no-console': 'error',
      'no-debugger': 'error',
      'no-undef': 'error',
      'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    },
  },
  {
    files: ['**/*.config.{js,mjs,cjs,ts,mts,cts}'],
    languageOptions: {
      globals: {
        process: 'readonly',
      },
    },
  },
];
