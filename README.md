# EvalAssist

<!-- Build Status, is a great thing to have at the top of your repository, it shows that you take your CI/CD as first class citizens -->
<!-- [![Build Status](https://travis-ci.org/jjasghar/ibm-cloud-cli.svg?branch=master)](https://travis-ci.org/jjasghar/ibm-cloud-cli) -->

<!-- Not always needed, but a scope helps the user understand in a short sentance like below, why this repo exists -->


## Run EvalAssist locally

### 1. Install the requirements

* npm
* Python >= 3.10

### 2. Install the dependencies

The following command will install the frontend and backend dependencies. It will install frontend dependencies using npm. In addition, it will install backend dependencies by creating a virtual environment, activating it and using pip to install the dependencies.

```bash
npm install
```

### 3. Set up a local database (optional)

This step is only required if you are not using a deployed database and you want to deploy your own locally.

1. Install Rancher following [this steps](https://docs.rancherdesktop.io/getting-started/installation/). You may use any other container managment system that supports docker.

2. Run `npm run db`. This will create and run an empty Postgres database. It's default URL is `postgres://admin:admin@127.0.0.1:5432/eval-assist-local`.

### 4. Set the environment variables

Both frontend and backend need a few environment variables to be set in order to work properly.

Create an `.env` file in the root directory with the following entries:

* `DATABASE_URL`
* `NEXT_PUBLIC_BACKEND_API_HOST`
* `NEXT_PUBLIC_USE_AUTH`

_Note: you can use the content of `.env.example` to start with some default values:_

```bash
cp .env.example .env
```

### 5. Sync the local database

If you are managing the database make sure that it is synchronized with the prisma schema by running the following command:

`npm run prisma:sync`

### 6. Run the system

The following command will run both the backend and the frontend concurrently. If you want to run them separately you can use `dev:backend` and `dev:frontend`.

```bash
npm run dev
```

### 7. Open EvalAssist

Visit [https://localhost:3000](https://localhost:3000)
