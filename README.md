# EvalAssist

<!-- Build Status, is a great thing to have at the top of your repository, it shows that you take your CI/CD as first class citizens -->
<!-- [![Build Status](https://travis-ci.org/jjasghar/ibm-cloud-cli.svg?branch=master)](https://travis-ci.org/jjasghar/ibm-cloud-cli) -->

<!-- Not always needed, but a scope helps the user understand in a short sentance like below, why this repo exists -->

## Run EvalAssist locally

### 1. Install the requirements

* Node > 20 (install [here](https://nodejs.org/en/download))
* Python >= 3.10, <3.13

_Note: In this project, npm is used both as a task manager (used to easily setup the dev environment) and as the package manager for the Next.js frontend app._

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

* `DATABASE_URL`: the URL of the database
* `NEXT_PUBLIC_BACKEND_API_HOST`: the URL of the backend FastAPI app
* `NEXT_PUBLIC_USE_AUTH`: whether to use authentication or not. Authentication is performed through IBMId Oauth, but other methods can be added/contributed.

_Note: you can use the content of `.env.example` to start with some default values:_

```bash
cp .env.example .env
```

### 5. Sync the Prisma schema with the Postgres database _(only if you are its admin)_

The following command synchronizes the prisma schema with the database, making sure all the required tables exist.

`npm run prisma:sync`

### 6. Run the system

The following command will run both the backend and the frontend concurrently. If you want to run them separately you can use `start:backend` and `start:frontend`.

```bash
npm start
```

**Important:** Sensitive data, such as API keys from third-party providers, is transmitted between the frontend and backend and must be encrypted. Ensure proper TLS termination when deploying the system.

### 7. Open EvalAssist

Visit [http://localhost:3000](https://localhost:3000)

## Commands summary

* **install**:  Installs dependencies for both the backend and frontend in parallel.
* **install:backend**: Sets up the Python virtual environment and installs backend dependencies.
* **install:frontend**: Installs frontend dependencies using npm.
* **start**:  Starts both the backend and frontend, ensuring Prisma is set up first.
* **start:backend**: Runs the FastAPI backend using the Python virtual environment.
* **start:frontend**: Waits for the backend to be ready, then starts the Next.js frontend.
* **prisma**:  Prepares and generates Prisma clients for both backend and frontend.
* **prisma:prepare**: Merges the Prisma schema for both backend and frontend.
* **prisma:generate**: Generates Prisma clients for both backend and frontend in parallel.
* **prisma:sync** : Runs Prisma database migrations using the backend schema.
* **db**: Starts a local PostgreSQL database using Docker.
* **pre-commit**: Runs pre-commit hooks for both backend and frontend.
* **clean**:  Removes dependencies and generated files from both backend and frontend.
* **clean-backend**: Deletes the backend virtual environment and generated Prisma schema.
* **clean-frontend**: Removes frontend dependencies and generated Prisma schema.
