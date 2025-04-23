FROM python:3.12-slim
WORKDIR /app
COPY . .

ARG DATABASE_URL
ENV DATABASE_URL $DATABASE_URL

RUN pip install --no-cache-dir --upgrade -r requirements.txt
RUN prisma generate
EXPOSE 8000
CMD ["sh", "-c", "prisma", "migrate", "dev", "--name", "init", "&&", "uvicorn", "evalassist.main:app", "--workers", "1", "--host", "0.0.0.0", "--port", "8000", "--timeout-keep-alive", "120"]
