module.exports = {
  env: {
    es2021: true,
    node: true,
  },
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  plugins: ['@typescript-eslint', 'simple-import-sort', 'tsdoc', 'import'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:import/recommended',
    'plugin:import/typescript',
    'prettier',
  ],
  ignorePatterns: ['dist/**/*', '.eslintrc.cjs', 'node_modules/**'],
  rules: {
    'tsdoc/syntax': 'warn',
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
    'no-unused-vars': 'off',
    '@typescript-eslint/no-unused-vars': [
      'warn',
      {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
        caughtErrorsIgnorePattern: '^_',
      },
    ],
  },
  settings: {
    'import/resolver': {
      typescript: {
        alwaysTryTypes: true,
        project: './tsconfig.json',
      },
    },
  },
  overrides: [
    {
      files: ['*.config.js', '*.cjs'],
      parserOptions: {
        project: null,
      },
      rules: {
        'tsdoc/syntax': 'off',
      },
    },
  ],
};
