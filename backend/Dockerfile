FROM python:3.10
WORKDIR /

COPY ./requirements.txt /requirements.txt 
RUN pip install --no-cache-dir --upgrade -r /requirements.txt

COPY ./prisma ./prisma
ARG DATABASE_URL
ENV DATABASE_URL $DATABASE_URL
RUN prisma generate

COPY . /
EXPOSE 8000
CMD ["uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8000"]