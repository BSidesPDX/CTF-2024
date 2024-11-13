FROM python:3.10-slim
LABEL maintainer="tnoyes@pdx.edu"
COPY . /app
WORKDIR /app
RUN pip install -r requirements.txt
CMD gunicorn --bind :80 --workers 1 --threads 8 app:app
