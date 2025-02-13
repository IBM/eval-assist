# EvalAssist

<!-- Build Status, is a great thing to have at the top of your repository, it shows that you take your CI/CD as first class citizens -->
<!-- [![Build Status](https://travis-ci.org/jjasghar/ibm-cloud-cli.svg?branch=master)](https://travis-ci.org/jjasghar/ibm-cloud-cli) -->

<!-- Not always needed, but a scope helps the user understand in a short sentance like below, why this repo exists -->


## Run EvalAssist locally

### 1. Requirements

* npm
* Python >= 3.10

### 2. Install the dependencies

The following command will install the frontend and backend dependencies. It will install frontend dependencies using npm. In addition, it will install backend dependencies by creating a virtual environment, activating it and using pip to install the dependencies.

```bash
npm install
```

### 3. Set the environment variables

Both frontend and backend need a few environment variables to be set.

Creante an `.env` file in the /backend folder with the following entry:

* DATABASE_URL

Creante an `.env` file in the /frontend folder with the following entry:

* NEXT_PUBLIC_BACKEND_API_HOST

* NEXT_PUBLIC_USE_AUTH

### 4. Run the system

The following command will run both the backend and the frontend concurrently. If you want to run them separately you can use `dev:backend` and `dev:frontend`.

```bash
npm run dev
```

### 5. Open EvalAssist

Visit `https://localhost:3000`
