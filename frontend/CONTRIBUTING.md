# Contributing <!-- omit in toc -->

Thank you for taking the time to contribute to this project! :tada:

The following is an agreed set of guidelines for contributing to this project. If you feel anything needs clarifying or amending, please make a pull request to change this document.

- [Raising Issues](#raising-issues)
  - [Reporting Bugs](#reporting-bugs)
  - [Suggesting Enhancements](#suggesting-enhancements)
  - [Asking Questions](#asking-questions)
- [Development Environment Setup](#development-environment-setup)
- [Contributing Code](#contributing-code)
  - [Branching](#branching)
  - [Committing](#committing)
  - [Raising a Pull Request](#raising-a-pull-request)
    - [Code Reviews](#code-reviews)

## Raising Issues
All work items are tracked as [GitHub issues](https://guides.github.com/features/issues/). There are different types of issues which can be raised; each with it's own issue template for you to fill out.

### Reporting Bugs
When raising a bug, choose the [Bug issue template](/.github/ISSUE_TEMPLATE/BUG.md) and provide all the information requested. It's important that the reader understands how to replicate the bug and what the desired outcome should have been. 

### Suggesting Enhancements
If you'd like to suggest an enhancement or adding a new feature to the repository, choose the [Enhancement](/.github/ISSUE_TEMPLATE/ENHANCEMENT.md) or [Feature Request](./.github/ISSUE_TEMPLATE/FEATURE.md) templates and fill in the information accordingly. It's important the reader fully understands the purpose of the issue so they understand how to assign and implement accordingly.

### Asking Questions
Any question is welcomed! These can be raised using the [Question](/.github/ISSUE_TEMPLATE/QUESTION.md) template and will be responded to as soon as possible!

## Development Environment Setup
It is recommended to use [VSCode](https://code.visualstudio.com/) as your code editor for this project. The following extensions will make coding much easier:

- [Better Comments](https://marketplace.visualstudio.com/items?itemName=aaron-bond.better-comments)
- [Bracket Pair Colorization Toggler](https://marketplace.visualstudio.com/items?itemName=dzhavat.bracket-pair-toggler)
- [ESLint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint)
- [GitLens — Git supercharged](https://marketplace.visualstudio.com/items?itemName=eamodio.gitlens)
- [IntelliCode](https://marketplace.visualstudio.com/items?itemName=VisualStudioExptTeam.vscodeintellicode)
- [Live Preview](https://marketplace.visualstudio.com/items?itemName=ms-vscode.live-server)
- [Prettier - Code formatter](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode)
- [Prettier ESLint](https://marketplace.visualstudio.com/items?itemName=rvest.vs-code-prettier-eslint)
- [Prettify JSON](https://marketplace.visualstudio.com/items?itemName=mohsen1.prettify-json)

It is also useful to set "Files: Auto Save" and "Editor: Format On Save" to true in the Preferences

## Contributing Code 
To contribute code to this repository, it's important to understand our guidelines.

### Branching
Within APT we use a branching strategy which has been adapted from this [strategy](https://gist.github.com/digitaljhelms/4287848) outlined in this [post](https://nvie.com/posts/a-successful-git-branching-model/).

`main` and `stable` branches are always protected so you cannot commit code to them. Merges into `main` are accepted from development branches and hot-fixes.

To create a development branch:
```
git checkout main
git checkout -b <issue_number>-<branch_name>
```

If the development branch becomes out of date with `main`, [rebasing](https://www.atlassian.com/git/tutorials/merging-vs-rebasing) should be used where possible rather than merging to keep a clean commit history.

### Committing
Within APT, git commit messages are linted using the [conventional commits guidelines](https://www.conventionalcommits.org/) and [commitlint package](https://www.npmjs.com/package/@commitlint/config-conventional).

All commit messages are linted using a pre-commit hook with [Husky](https://typicode.github.io/husky/#/) so it's important to understand how to structure your commit messages.

All commit messages should be atomic, conform to the template below and contain an issue number where appropriate as PRs have a strong preference to cite an issue number or have their commits contain issue numbers.

1. The title must start with one of the following words:
`feat|fix|docs|style|refactor|perf|test|chore`

2. You can use one of the following before the issue number reference:
`Resolves|Closes|Contributes to|Reverts`

3. Your email must conform to this format:
`[^@]+@.*ibm.com`

To speed up the process of creating a conforming commit message, it's recommended to create a template file:

1. Create a file in your home directory named `.gitmessage` with this content (replacing with your own email):
    ```
    feat|fix|docs|style|refactor|perf|test|chore: <subject>


    <body>


    Resolves|Closes|Contributes to|Reverts: apt-research/<repo-name>#<issue number>


    Signed-off-by: Your Name <<email@ibm.com>>
    ```

2. Run `git config --global --add commit.template ~/.gitmessage`.
3. The default editor when writing commit messages usually requires you to use the terminal. You can change this to use another editor, such as VS Code: `git config --global core.editor "code --wait"`

### Raising a Pull Request
The standard [GitHub pull request](https://help.github.com/en/articles/about-pull-requests) process is used to request merging any code into a desired branch. Whenever you raise a PR, a template is provided for you to fill in the necessary details. It's important that you attach the relevant GitHub issue for tracking purposes, add all required details and ensure any status checks are passing (otherwise it may be rejected).

#### Code Reviews
All pull requests require reviews and passing status checks before merging. Branches also need to be up to date (see [branching](#branching)).

Stale pull requests are  dismissed whenever any new commits are pushed to the working branch.

All pull requests are set by default to use the "Squash and Merge" button so your commits are squashed into one before being merged. This is why it's important to have properly written commits.

Once merged, your head branch will automatically be deleted to ensure cleaniless of the repository.

In some projects, there is a list of code owners which are required to review any pull requests. Sometimes, the list of people who can dismiss pull request reviews is also defined.
