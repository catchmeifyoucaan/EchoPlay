module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint', 'import'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:import/recommended',
    'plugin:import/typescript',
    'prettier'
  ],
  parserOptions: {
    ecmaVersion: 2021,
    sourceType: 'module'
  },
  rules: {
    'import/order': [
      'warn',
      {
        'alphabetize': { order: 'asc', caseInsensitive: true },
        'newlines-between': 'always'
      }
    ]
  },
  ignorePatterns: ['dist', 'node_modules']
};
