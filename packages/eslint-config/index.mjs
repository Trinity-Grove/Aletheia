import parser from '@typescript-eslint/parser';

export default [
  {
    ignores: ['.next/**', 'dist/**', 'coverage/**', 'node_modules/**'],
  },
  {
    files: ['**/*.{js,mjs,cjs,ts,mts,cts}'],
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
];
