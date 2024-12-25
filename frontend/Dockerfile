FROM node:20

# Ustaw katalog roboczy
WORKDIR /app

# Kopiujemy pliki projektu
COPY package.json package-lock.json ./
RUN npm install

COPY . .

# Komenda startowa
CMD ["npm", "run", "dev"]
