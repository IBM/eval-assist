# → Stage 1: Build Next.js static app
FROM node:20-alpine AS frontend-builder

WORKDIR /frontend
COPY frontend/package*.json frontend/tsconfig*.json ./
RUN npm ci

COPY frontend/ ./
ENV NEXT_OUTPUT_MODE=export
RUN ls
RUN npm run build 

# → Stage 2: Build Python/FastAPI + static server
FROM python:3.11-slim
RUN apt-get update \
    && apt-get install -y --no-install-recommends build-essential \
    && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY backend/pyproject.toml backend/poetry.lock* /app/
COPY backend/evalassist /app/evalassist
RUN mkdir /app/evalassist/data && chmod 777 /app/evalassist/data
RUN pip install poetry \
    && poetry config virtualenvs.create false \
    && poetry install

COPY --from=frontend-builder /frontend/out /app/evalassist/static
RUN ls ./evalassist
EXPOSE 8000
CMD ["eval-assist", "serve", "--host", "0.0.0.0", "--port", "7860"]
