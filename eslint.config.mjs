import js from '@eslint/js';
import solid from 'eslint-plugin-solid';
import babelParser from '@babel/eslint-parser';
import prettier from 'eslint-config-prettier';

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
        },
      },
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
