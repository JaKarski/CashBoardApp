FROM python:3.12-slim

# Set working directory
WORKDIR /app

# Copy required files
COPY requirements.txt .

# Install dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy source code
COPY . .

# Set the startup command (Gunicorn)
CMD ["gunicorn", "--bind", "0.0.0.0:8000", "backend.wsgi:application", "--workers", "3"]
