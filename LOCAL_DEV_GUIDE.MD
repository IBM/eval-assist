
# Ready to Contribute to EvalAssist? Let's Get Started! 🚀

This comprehensive guide will walk you through setting up your local development environment quickly and easily.

## Setting Up Your Local Environment

### 1. Clone the repository

Start by cloning the repository to your local machine using Git:

```bash
git clone https://github.com/IBM/eval-assist.git 
# or via ssh: git clone git@github.ibm.com:AIExperience/eval-assist.git
cd eval-assist
```

### 2. Install the requirements

* Node > 20 (install [here](https://nodejs.org/en/download))
* Python >= 3.10, <3.14

_Note: In this project, npm is used both as a task manager (used to easily setup the dev environment) and as the package manager for the Next.js frontend app._

### 3. Install the dependencies

The following command will install the frontend and backend dependencies. It will install the frontend dependencies using npm. In addition, it will install the backend dependencies using [poetry](https://python-poetry.org/docs/).

```bash
npm install
```

_Note: you can run `npm run install:[backend|frontend]` to install components separately. This can be useful to customize the way you install them. For example: install the frontend running `npm run install:frontend` and install the backend dependencies using other package installer than `poetry`, like `uv`._

### 4. Set the environment variables

Both frontend and backend need a few environment variables to be set in order to work properly.

Create an `.env` file in the root directory with the following entries:

* `NEXT_PUBLIC_BACKEND_API_HOST`: the URL of the backend FastAPI app
* `NEXT_PUBLIC_USE_AUTH`: whether to use authentication or not. Authentication is performed through IBMId Oauth, but other methods can be added/contributed.

_Note: you can use the content of `.env.example` to start with some default values:_

```bash
cp .env.example .env
```

### 5. Run the system

The following command will run both the backend and the frontend concurrently. If you want to run them separately you can use `start:backend` and `start:frontend`.

```bash
npm start
```

**Important:** Sensitive data, such as API keys from third-party providers, is transmitted between the frontend and backend and must be encrypted. Ensure proper TLS termination when deploying the system.

### 6. Open EvalAssist

Visit [http://localhost:3000](https://localhost:3000)

_Check out the tutorials to see how to [run evaluations](https://github.com/IBM/eval-assist/wiki#mini-tutorial-running-an-evaluation) and [generate synthetic data](https://github.com/IBM/eval-assist/wiki#mini-tutorial-generating-test-data)._

## Commands summary

* **install**:  Installs dependencies for both the backend and frontend in parallel.
* **install:backend**: Sets up the Python virtual environment and installs backend dependencies.
* **install:frontend**: Installs frontend dependencies using npm.
* **start**:  Starts both the backend and frontend, ensuring Prisma is set up first.
* **start:backend**: Runs the FastAPI backend using the Python virtual environment.
* **start:frontend**: Waits for the backend to be ready, then starts the Next.js frontend.
* **pre-commit**: Runs pre-commit hooks for both backend and frontend.
* **clean**:  Removes dependencies and generated files from both backend and frontend.
* **clean-backend**: Deletes the backend virtual environment.
* **clean-frontend**: Removes frontend dependencies.
