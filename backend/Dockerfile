FROM python:3.12-slim
WORKDIR /app
COPY . .

ARG DATABASE_URL
ENV DATABASE_URL $DATABASE_URL

RUN pip install --no-cache-dir -r requirements_lock.txt
RUN prisma generate
EXPOSE 8000
CMD prisma migrate deploy && uvicorn evalassist.main:app --workers 8 --host 0.0.0.0 --port 8000 --timeout-keep-alive 120
