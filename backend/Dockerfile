FROM python:3.12-slim

# Ustawiamy katalog roboczy
WORKDIR /app

# Kopiujemy wymagane pliki
COPY requirements.txt .

# Instalujemy zależności
RUN pip install --no-cache-dir -r requirements.txt

# Kopiujemy kod źródłowy
COPY . .

# Ustawiamy polecenie startowe (Gunicorn)
CMD ["gunicorn", "--bind", "0.0.0.0:8000", "backend.wsgi:application", "--workers", "3"]
