# Use official Python slim runtime for Google Cloud Run compatibility
FROM python:3.11-slim

# Prevent Python from writing .pyc files & enable stdout buffering
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PORT=8000

WORKDIR /app

# Install dependencies first for efficient layer caching
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application backend files
COPY . .

# Expose default port
EXPOSE 8000

# Start FastAPI application using uvicorn binding on 0.0.0.0:$PORT
CMD exec uvicorn main:app --host 0.0.0.0 --port ${PORT}
