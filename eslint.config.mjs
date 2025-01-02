import tsParser from '@typescript-eslint/parser';
import importPlugin from 'eslint-plugin-import';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import prettier from 'eslint-config-prettier';
import tsdocPlugin from 'eslint-plugin-tsdoc';
import simpleImportSortPlugin from 'eslint-plugin-simple-import-sort';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/** @type {import('eslint').Linter.Config[]} */
export default [
  {
    name: 'Global Ignores',
    ignores: ['dist/**/*'],
  },
  {
    name: 'Typescript',
    files: ['**/*.ts'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        tsconfigRootDir: __dirname,
        project: ['./tsconfig.json', './tsconfig.node.json'],
        sourceType: 'module',
        ecmaVersion: 'latest',
      },
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
      import: importPlugin,
      tsdoc: tsdocPlugin,
      'simple-import-sort': simpleImportSortPlugin,
    },
    settings: {
      'import/extensions': ['.ts'],
      'import/parsers': {
        '@typescript-eslint/parser': ['.ts'],
      },
      'import/resolver': {
        typescript: {
          alwaysTryTypes: true,
          project: './tsconfig.json',
        },
      },
    },
    rules: {
      ...tsPlugin.configs.recommended.rules,
      ...importPlugin.configs.recommended.rules,
      ...prettier.rules,
      '@typescript-eslint/member-ordering': [
        'error',
        {
          default: {
            memberTypes: [
              'public-static-field',
              'protected-static-field',
              'private-static-field',
              'public-static-method',
              'protected-static-method',
              'private-static-method',
              'public-instance-field',
              'protected-instance-field',
              'private-instance-field',
              'public-constructor',
              'public-instance-method',
              'protected-instance-method',
              'private-instance-method',
            ],
          },
        },
      ],
      'simple-import-sort/imports': [
        'error',
        {
          groups: [
            [
              '^node:', // Node.js builtins
              '^@?\\w', // Packages.
              '^@(/.|$)', // Absolute imports
              '^\\u0000', // Side effect imports
              '^\\.\\.(?!/?$)', // Parent imports. '..' last
              '^\\.\\./?$',
              '^\\./(?=.*/)(?!/?$)', // Other relative imports. Put same-folder imports and '.' last
              '^\\.(?!/?$)',
              '^\\./?$',
            ],
          ],
        },
      ],
      'simple-import-sort/exports': 'error',
      'import/first': 'error',
      'import/newline-after-import': 'error',
      'import/no-duplicates': 'error',
      'import/namespace': 'off',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
    },
  },
  {
    name: 'Config Files',
    files: ['**/*.js', '**/*.cjs', '**/*.mjs'],
    languageOptions: {
      parserOptions: {
        project: null,
      },
    },
    rules: {
      'tsdoc/syntax': 'off',
    },
  },
];
