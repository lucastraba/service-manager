/** @type {import('typedoc').TypeDocOptions} */
module.exports = {
  entryPoints: ['src/main.ts'],
  excludeInternal: true,
  plugin: ['typedoc-plugin-markdown', 'typedoc-plugin-missing-exports'],
  excludeExternals: true,
  out: 'docs',
};
