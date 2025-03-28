FROM python:3.9-slim

WORKDIR /app

COPY . .

RUN pip install --no-cache-dir -r requirements.txt

CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "${PORT:-8001}"]
