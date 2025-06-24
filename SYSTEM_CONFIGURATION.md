# System Configuration

EvalAssist provides a set of environment variables and command parameter that allow you to customize and configure various aspects of the application. This page serves as a comprehensive reference for all available environment variables, providing their types, default values, and descriptions.

## Environment variable configuration

- **DATA_DIR**: Specifies the base directory for data storage including EvalAssist database and Unitxt inference cache. Defaults to `./data`

- **DATABASE_URL**: Specifies the database URL to connect to. Defaults to `sqlite:///${DATA_DIR}/evalassist.db`

- **UNITXT_INFERENCE_ENGINE_CACHE_PATH**: Specified the path where Unitxt stores cache for the inference engine. Unitxt creates an SQLite database to store previous inference provider calls using `diskcache`. You can disable caching using `$UNITXT_CACHE_ENABLED`. Defaults to `${DATA_DIR}/inference_engine_cache`

- **UNITXT_CACHE_ENABLED**: disables Unitxt caching. Note that caching for synthetic data generation is always disabled. Defaults to `true`

- **AUTHENTICATION_ENABLED**: Enables authentication. Currently, authentication is can be enabled only if backend and frontend are deployed separately, because the frontend uses dynamic route to implement auth. Defaults to `false`

- **STORAGE_ENABLED**: Enables storing EvalAssist data. If disabled, any functionality that requires a database, like authentication and saving test cases won't be available. Defaults to `true`

- **UVICORN_WORKERS**: The number of uvicorn workers to pass to `uvicorn.run`. Defaults to `1`

- **STATIC_DIR**: The path to the frontend static files the FastAPI app will use to serve static files. Defaults to `${EVAL_ASSISST_DIR}/static`

- **NEXT_PUBLIC_BACKEND_API_HOST**: Specifies the URL of the backend. Only required if the frontend is deployed separately as a Next.js app. Defaults to `''` (empty string)

- **CUSTOM_MODELS_PATH**: The path to the custom models. Look at [this example](backend/custom_models_example.json). Defaults to `${EVALASSIST_DIR}/custom_models.json`

## Commmand parameter variable configuration

The following parameters can be passed to `eval-assist serve`:

- **--host**: The host at which the app will be reachable. Defualts to `127.0.0.1`

- **--port**: The port at which the app will be reachable. Defualts to `8000`

- **--reload**: Whether to here for changes in a development environment and reload the FastAPI. Defaults to `false`
