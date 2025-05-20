# EvalAssist

<!-- Build Status, is a great thing to have at the top of your repository, it shows that you take your CI/CD as first class citizens -->
<!-- [![Build Status](https://travis-ci.org/jjasghar/ibm-cloud-cli.svg?branch=master)](https://travis-ci.org/jjasghar/ibm-cloud-cli) -->

<!-- Not always needed, but a scope helps the user understand in a short sentance like below, why this repo exists -->

EvalAssist is an LLM-as-a-Judge framework built on top of the [Unitxt](https://www.unitxt.ai/en/latest/docs/introduction.html)
open source evaluation library for large language models. The EvalAssist application provides users with a
convenient way of iteratively testing and refining LLM-as-a-judge criteria, and supports both direct
(rubric-based) and pairwise assessment paradigms (relation-based), the two most prevalent forms of
LLM-as-a-judge evaluations available. EvalAssist is designed to be model-agnostic, i.e. the content to be
evaluated can come from any model. EvalAssist supports a rich set of off-the-shelf judge models that can
easily be extended. An API key is required to use the pre-defined judge models. Once users are satisfied
with their criteria, they can auto-generate a Notebook with Unitxt code to run bulk evaluations with larger
data sets based on their criteria definition. EvalAssist also includes a catalog of example test cases,
exhibiting the use of LLM-as-a-judge across a variety of scenarios. Users can save their own test cases.

## Run EvalAssist locally

### 1. Clone the repository

Start by cloning the repository to your local machine using Git:

```bash
git clone https://github.ibm.com/AIExperience/eval-assist.git 
# or via ssh: git clone git@github.ibm.com:AIExperience/eval-assist.git
cd eval-assist
```

### 2. Install the requirements

* Node > 20 (install [here](https://nodejs.org/en/download))
* Python >= 3.10, <3.14

_Note: In this project, npm is used both as a task manager (used to easily setup the dev environment) and as the package manager for the Next.js frontend app._

### 3. Install the dependencies

The following command will install the frontend and backend dependencies. It will install the frontend dependencies using npm. In addition, it will install the backend dependencies by creating a virtual environment (`venv`), activating it and using pip to install the dependencies.

```bash
npm install
```

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

## Custom models

You can add custom new evaluators to EvalAssist using any of the supported providers. To do so, ask you system administrator to add a `custom_models.json` file to the backend's folder. For example, to add DeepSeek R1 Distill
Llama 70B as an evaluator, add the following json:

```json
[
  {
    "name": "DeepSeek R1 Distill Llama 70B",
    "path": "deepseek-ai/DeepSeek-R1-Distill-Llama-70B",
    "providers": ["local_hf"],
  },
]
```
