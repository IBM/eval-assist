FROM python:3.10
WORKDIR /

ARG GH_TOKEN
ENV GH_TOKEN $GH_TOKEN

COPY ./requirements/common.txt /common.txt
COPY ./requirements/prod.txt /prod.txt 

RUN pip install --no-cache-dir --upgrade -r /prod.txt

COPY ./prisma ./prisma
ARG DATABASE_URL
ENV DATABASE_URL $DATABASE_URL
RUN prisma generate

COPY . /
EXPOSE 8000
CMD ["uvicorn", "src.main:app", "--workers", "4", "--host", "0.0.0.0", "--port", "8000"]