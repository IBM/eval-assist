# EvalAssist

<!-- Build Status, is a great thing to have at the top of your repository, it shows that you take your CI/CD as first class citizens -->
<!-- [![Build Status](https://travis-ci.org/jjasghar/ibm-cloud-cli.svg?branch=master)](https://travis-ci.org/jjasghar/ibm-cloud-cli) -->

<!-- Not always needed, but a scope helps the user understand in a short sentance like below, why this repo exists -->

## Getting started

### Run EvalAssist locally

#### 1. Requirements

* Yarn
* NPM
* Python >= 3.10

#### 2. Install the dependencies

The following command will install the frontend dependencies using Yarn and the backend dependencies in a venv folder.

```bash
yarn run install
```

#### 3. Set the environment variables

Both frontend and backend need a few environment variables to be set.

Creante an `.env` file in the /backend folder with the following entry:

* DATABASE_URL

Creante an `.env` file in the /frontend folder with the following entry:

* NEXT_PUBLIC_BACKEND_API_HOST

* NEXT_PUBLIC_USE_AUTH

#### 4. Run the system

The following command will run both the backend and the frontend concurrently. If you want to run them separately you can use `dev:backend` and `dev:frontend`.

```bash
yarn run dev
```
