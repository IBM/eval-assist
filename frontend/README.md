# Frontend Web App Template <!-- omit in toc -->

Looking to create a new web application project? This is a [template repository](https://docs.github.com/en/repositories/creating-and-managing-repositories/creating-a-repository-from-a-template#creating-a-repository-from-a-template) that you can use to quickly get started.

This template has been designed as the basis for a frontend web application using the React and Next JS frameworks, written in Typescript. It contains basic functionality and folder structure with the aim of being ready to build upon for your own application needs.

## Table of Contents <!-- omit in toc -->

- [Getting Started](#getting-started)
- [How to Use This Template](#how-to-use-this-template)
- [Contribution Guidelines](#contribution-guidelines)
- [Technical Details](#technical-details)
  - [Next JS](#next-js)
  - [Code Linting \& Formatting](#code-linting--formatting)
  - [Data Fetching](#data-fetching)
  - [Date Formatting](#date-formatting)
  - [Environment Variables](#environment-variables)
  - [Styling](#styling)
  - [Carbon](#carbon)
  - [Git Commit Linting](#git-commit-linting)
  - [Commit Hooks](#commit-hooks)
  - [Translation Support](#translation-support)
  - [Authentication](#authentication)
- [Repository Structure](#repository-structure)

## Getting Started

Welcome :wave:

If you are using this template, then you're likely starting a project within the APT organisation. To find out more about how we work, visit our [playbook](https://apt-playbook.wdc1a.ciocloud.nonprod.intranet.ibm.com/) and join our slack channels:

- [#global-advanced-prototyping](https://ibm-research.slack.com/archives/C029R1XUBP0)
- [#03-advanced-prototyping-catalyst](https://ibm-research.slack.com/archives/C02RSC62X2R)

## How to Use This Template

1. [Create a new repository from a template](https://docs.github.com/en/repositories/creating-and-managing-repositories/creating-a-repository-from-a-template#creating-a-repository-from-a-template).

   > NOTE: If making a prototype for APT, ensure your new repository is created under the [apt-research](https://github.ibm.com/apt-research) organisation in GitHub.

2. Replace the root `README.md` (this file) with the `README_TEMPLATE.md` file and replace the contents with your project's information.

3. Read and modify the `CONTRIBUTING.md` file to add any additional information for your project.

   > NOTE: This file contains useful information on commit message format and how to avoid git commit linting errors

4. Modify the `.github/CODEOWNERS` file to indicate who should be notified and assigned to new pull requests. For more information, see [GitHub's documentation](https://docs.github.com/en/free-pro-team@latest/github/creating-cloning-and-archiving-repositories/about-code-owners).
5. Optional (but recommended) - Modify the version of `"next"` used in `package.json` to be a fixed value instead of `latest`

6. Test the application installs and runs in development mode:

   ```
   yarn install
   yarn run dev
   ```

7. Feel free to change any of the other files to suit your needs. A breakdown of repository structure can be seen at the [end of this file](#repository-structure).

## Contribution Guidelines

Any suggestions for improvements to this repository are welcome and PRs to the template are encouraged! :pencil:

Please read our [contributing guide](/CONTRIBUTING.md) for details on submitting pull requests.

## Technical Details

The template was built in the following way:

### Next JS

This project is based off the [starter Next.js app](https://nextjs.org/docs/basic-features/typescript#create-next-app-support) which was created using:

```
yarn create next-app --typescript
```

This automatically sets the application to use [TypeScript](https://www.typescriptlang.org/) with [yarn](https://classic.yarnpkg.com/en/) and is configured in [React Strict Mode](https://nextjs.org/docs/api-reference/next.config.js/react-strict-mode).

### Code Linting & Formatting

Next JS automatically configures [ESLint](https://nextjs.org/docs/basic-features/eslint) for the project.

This project uses ESLint which is configured to work with Prettier:

```
yarn add --dev eslint-plugin-prettier
yarn add --dev --exact prettier
yarn add --dev eslint-config-prettier
```

This is recommended by [Next.js](https://nextjs.org/docs/basic-features/eslint#prettier) and was tweaked using the [ESLint Prettier Plugin](https://github.com/prettier/eslint-plugin-prettier).

To safeguard against a [common linting issue](https://github.com/vercel/next.js/discussions/40269), an additional rule has been included to create the final ESLint config in `.eslintrc.json`:

```
{
"extends": ["next/core-web-vitals", "plugin:prettier/recommended"],
"rules": {
    // https://github.com/vercel/next.js/discussions/40269
    "react/no-unknown-property": [
    2,
    {
        "ignore": ["global", "jsx"]
    }
    ]
}
}
```

An `.eslintignore` file is also included

The following [Prettier](https://prettier.io/) config in `prettier.config.js` is standard across APT projects:

```
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
```

If any additional grouping of imports is required, this can be added to the `importOrder` field shown above.

### Data Fetching

[SWR](https://swr.vercel.app/docs/getting-started) has been added as a dependency to the project as [recommended by Next.js](https://nextjs.org/docs/basic-features/data-fetching/client-side#client-side-data-fetching-with-swr):

```
yarn add swr
```

To validate schemas when fetching data, [Zod](https://github.com/colinhacks/zod) is used

```
yarn add zod
```

### Date Formatting

[date-fns](https://date-fns.org/) has been added as a dependency to the project as used in the [Next.js tutorial](https://nextjs.org/learn/basics/dynamic-routes/polishing-post-page):

```
yarn add date-fns
```

### Environment Variables

Environment variables should be included in `.env` files as described [in the Next.js documentation](https://nextjs.org/docs/basic-features/environment-variables#default-environment-variables).

For use in the application, environment variables should be customised and exported under `src/env/index.ts`

### Styling

Sass was included as a dependency and is [supported by Next.js](https://nextjs.org/docs/basic-features/built-in-css-support#sass-support):

```
yarn add sass --dev
```

### Carbon

The APT organisation currently uses [Carbon v11](https://carbondesignsystem.com/developing/frameworks/react/) components for React applications:

```
yarn add @carbon/react
```

With modules declared in a `carbon.d.ts` file

### Git Commit Linting

Within APT, git commit messages are linted using the [conventional commits guidelines](https://www.conventionalcommits.org/) and [commitlint package](https://www.npmjs.com/package/@commitlint/config-conventional).

### Commit Hooks

[Husky](https://typicode.github.io/husky/#/) is used for pre-commit linting of commit messages and code.

### Translation Support

For front-end translation support in Next.js applications, [next-i18next](https://github.com/i18next/next-i18next) is used. This was added using:

```
yarn add next-i18next react-i18next i18next
```

All translations are included under `public/locales` with configuration defined in `next-i18next.config.js`.

### Authentication

To provide authentication support, the [`next-auth` package](https://next-auth.js.org/getting-started/example) has been added as recommedended in the [Next.js documentation](https://nextjs.org/docs/authentication).

```
yarn add next-auth
```

An empty `[...nextauth].ts` file has also been added under `src/pages/api/auth` which can be removed if authentication is not needed in the application.

## Repository Structure

The folder structure of this repository is as follows:

```
.
|___.github/
|   |___ISSUE_TEMPLATE/
|   |   |___BUG.md                  * Issue template for bugs found
|   |   |___DOCUMENTATION.md        * Issue template for updating documentation
|   |   |___ENHANCEMENT.md          * Issue template for an enhancement request
|   |   |___EPIC.md                 * Issue template for a new epic
|   |   |___FEATURE.md              * Issue template for a feature request
|   |   |___QUESTION.md             * Issue template for any questions
|   |___PULL_REQUEST_TEMPLATE.md    * Standard PR template
|___public/                         * Static assets (https://nextjs.org/learn/basics/assets-metadata-css/assets)
|   |___images/                     * Image files
|___src/                            * All source code files
|   |___components/                 * React components to be used on pages
|   |   |___ThemePreference/        * Custom Theme Preference component
|   |   |___index.ts                * Root index file (each component will have it's own index.ts)
|   |___env/                        * Customised environment variables
|   |   |___index.ts                * Exporting / creation of environment variables
|   |___hooks/                      * Custom React hooks folder - each hook should be contained in it's own file named "use<Function>.ts"
|   |   |___index.ts                * Root index file for exporting hooks
|   |___pages/                      * Next.js pages (https://nextjs.org/docs/basic-features/pages)
|   |   |___api/                    * Internal API (https://nextjs.org/docs/api-routes/introduction)
|   |   |   |___auth/               * All requests to /api/auth/* will automatically be handled by NextAuth.js
|   |   |   |   |___[...nextauth].ts* Configuration for the dynamic route handler for NextAuth.js
|   |   |   |___hello-world.ts      * Empty sample api file
|   |   |___ _app.tsx               * Custom App (https://nextjs.org/docs/advanced-features/custom-app)
|   |   |___ _document.js           * Custom Document (https://nextjs.org/docs/advanced-features/custom-document)
|   |   |___index.tsx               * Root page
|   |___styles/                     * Styling for pages
|   |   |___globals.scss            * Global styles to be applied to all pages
|   |___types/                      * Custom TypeScript types
|   |   |___index.ts                * Root index file for exporting types
|   |___utils/                      * Folder for any custom util / lib files
|   |   |___constants.ts            * File to contain global constants
|___.commitlintrc.json              * Configuration for the commit message pre-commit hook check
|___.eslintignore                   * Files which should not be linted
|___.eslintrc.json                  * Configuration file for ESLint
|___.gitignore                      * All files which should not be commited to Git
|___.lintstagedrc                   * Configuration for the pre-commit staged file linting hook
|___carbon.d.ts                     * Module declarations for Carbon
|___CONTRIBUTING.md                 * Instructions on how to contribute to the repository
|___next-i18next.config.js          * Configuration for translation support
|___next.config.js                  * Next config file (https://nextjs.org/docs/api-reference/next.config.js/introduction)
|___package.json                    * Package management configuration
|___prettier.config.js              * Prettier formatting configuration
|___README.md                       * This file
|___README_TEMPLATE.md              * Template README file to replace this one
|___tsconfig.json                   * TypeScript compiler options
|___yarn.lock                       * Project dependencies
```
