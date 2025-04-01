FROM python:3.11-slim

WORKDIR /app

# ติดตั้ง dependencies สำหรับ pandas และ numpy
RUN apt-get update && apt-get install -y \
    build-essential \
    libpq-dev \
    gcc \
    python3-dev \
    && rm -rf /var/lib/apt/lists/*

COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY backend/ .

# ตั้งค่า environment variables
ENV PORT=8001

# เปิด port 8001
EXPOSE 8001

# รัน uvicorn server
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8001"]
