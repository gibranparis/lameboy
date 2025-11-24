// .eslintrc.cjs
/** @type {import('eslint').Linter.Config} */
module.exports = {
  root: true,
  extends: ['next/core-web-vitals'],
  parserOptions: {
    ecmaVersion: 2023,
    sourceType: 'module',
  },
  rules: {
    // We have legitimate apostrophes in text; don't block builds over them
    'react/no-unescaped-entities': 'off',

    // We're intentionally using tiny <img> icons (cart, etc.)
    '@next/next/no-img-element': 'off',

    // Keep hook dependency hints, but as warnings in editor (Vercel respects config)
    'react-hooks/exhaustive-deps': 'warn',
  },
}
