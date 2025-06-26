FROM python:3.12-slim
WORKDIR /app
COPY pyproject.toml poetry.lock* /app/
COPY src /app/src
RUN pip install poetry \
    && poetry config virtualenvs.create false \
    && poetry install

EXPOSE 8000
CMD ["eval-assist", "serve", "--host", "0.0.0.0", "--port", "8000"]
