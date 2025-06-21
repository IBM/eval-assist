FROM python:3.12-slim
WORKDIR /app
COPY . .

ARG USE_AUTH
ENV USE_AUTH $USE_AUTH

RUN pip install --no-cache-dir -r requirements_lock.txt
EXPOSE 8000
CMD uvicorn evalassist.main:app --workers 8 --host 0.0.0.0 --port 8000 --timeout-keep-alive 120
