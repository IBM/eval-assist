module.exports = {
  allowParens: 'always',
  singleQuote: true,
  trailingComma: 'all',
  printWidth: 120,
  semi: false,
  importOrder: [
    "^react(.*)",
    "^next(.*)",
    "^@carbon(.*)|@theme|@styles",
    "^zod(.*)|swr",
    "^@(.*)",
    "@/(.*)",
    "^[./]"
  ],
  importOrderSeparation: true,
  importOrderSortSpecifiers: true,
}
