/** @type {import("prettier").Options} */
module.exports = {
  plugins: ['prettier-plugin-packagejson', 'prettier-plugin-sort-json'],
  printWidth: 80,
  trailingComma: 'es5',
  tabWidth: 2,
  semi: true,
  singleQuote: true,
  arrowParens: 'always',
  endOfLine: 'auto',
  jsonRecursiveSort: true,
};
