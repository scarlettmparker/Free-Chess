import js from '@eslint/js';
import solid from 'eslint-plugin-solid';
import babelParser from '@babel/eslint-parser';
import prettier from 'eslint-config-prettier';
import globals from 'globals';

export default [
  {
    ignores: ['dist/', '.vite/', 'public/', 'server/dist/', 'node_modules/'],
  },
  js.configs.recommended,
  {
    files: ['**/*.{js,mjs,cjs,jsx,ts,tsx}'],
    languageOptions: {
      parser: babelParser,
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: 'module',
        requireConfigFile: false,
        babelOptions: {
          presets: ['@babel/preset-typescript'],
          plugins: ['@babel/plugin-syntax-jsx'],
        },
      },
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    rules: {
      // The babel parser erases types before linting, so `no-undef` fires on every
      // type name and `no-unused-vars` on every type-only import. TypeScript itself
      // is authoritative for both; turn the base rules off.
      'no-undef': 'off',
      'no-unused-vars': 'off',
    },
  },
  solid.configs['flat/recommended'],
  {
    settings: {
      solid: {
        type: 'module',
      },
    },
    rules: {
      'solid/reactivity': 'warn',
    },
  },
  prettier,
];
