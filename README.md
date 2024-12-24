# **Opis aplikacji CashBoard**

## **1. Nazwa i cel**
CashBoard to aplikacja webowa wspierająca graczy pokerowych w analizie wyników, zarządzaniu tablicami wyników oraz generowaniu szczegółowych statystyk. 
- Gry mogą być tworzone tylko przez administratora.
- Użytkownicy mogą logować się do systemu za pomocą tokenów JWT.
- Po zalogowaniu użytkownicy widzą ekran z podsumowaniem swoich zarobków/strat oraz statystykami, które są dynamicznie ładowane z backendu.

---

## **2. Struktura aplikacji**
Aplikacja jest podzielona na dwie główne części: backend (Django) i frontend (React z Vite).

### **Struktura plików**
```plaintext
CashBoard/
├── backend/                   # Backend aplikacji (Django)
│   ├── api/                   # Moduł API (modele, widoki, serializery)
│   ├── backend/               # Główna konfiguracja projektu Django (settings, urls, wsgi)
│   ├── manage.py              # Narzędzie do zarządzania projektem Django
│   └── requirements.txt       # Lista zależności backendu
├── venv/                      # Wirtualne środowisko Python
├── frontend/                  # Frontend aplikacji (React + Vite)
│   ├── eslint.config.js       # Konfiguracja ESLint
│   ├── index.html             # Główny plik HTML
│   ├── node_modules/          # Zależności frontendu (npm)
│   ├── package-lock.json      # Automatyczny plik do zarządzania zależnościami
│   ├── package.json           # Lista zależności frontendu
│   ├── public/                # Statyczne zasoby (favicon, obrazy)
│   ├── src/                   # Kod źródłowy frontendu (komponenty React)
│   └── vite.config.js         # Konfiguracja Vite
```

## **3. Technologie**
- **Frontend**:
  - Framework: React (`^18.3.1`)
  - Bundler: Vite (`^5.4.1`)
  - Zależności: Zdefiniowane w pliku `package.json`.
  - Adres API: Określony w pliku `.env`.
  - Port: `:3000`

- **Backend**:
  - Język: Python (`3.12.6`)
  - Framework: Django (`5.1.1`)
  - API: Obsługiwane za pomocą Django REST Framework (DRF).
  - Zależności: Zdefiniowane w pliku `requirements.txt`.
  - Port: `:8000`
  - Baza danych: PostgreSQL.

---

## **4. Sposób uruchamiania aplikacji**
- **Backend**:
  - Uruchamiany w wirtualnym środowisku Python (`venv`) przy użyciu standardowego serwera deweloperskiego Django.
- **Frontend**:
  - Uruchamiany lokalnie za pomocą Vite (`npm run dev`).
- Oba środowiska mogą być automatycznie uruchamiane za pomocą skryptów.

---

## **5. Funkcje**
1. **Autoryzacja użytkowników**:
   - Logowanie za pomocą tokenów JWT.
   - Ochrona zapytań API przez autoryzację.
2. **Tablice wyników**:
   - Zarządzane przez administratora.
   - Zawierają dane dotyczące gier pokerowych.
3. **Statystyki użytkowników**:
   - Analiza zarobków, strat i innych kluczowych wskaźników.
   - Dynamicznie ładowane z backendu.
4. **REST API**:
   - Obsługuje logowanie, zarządzanie danymi i pobieranie statystyk.

---

## **6. Hosting**
- Hosting oraz domena zostały wykupione na platformach **Hostido** oraz **Mikrus 3.0**.
- Backend i baza danych zostały przeniesione na PostgreSQL.

---

## **7. Zabezpieczenia**
- Użytkownicy są autoryzowani przez tokeny JWT.
- Adres API jest ukryty w pliku `.env` frontendu.
- Backend obsługuje plik `.env` dla większego bezpieczeństwa.

---


# **Instrukcja uruchamiania aplikacji CashBoard**

## **1. Pobranie repozytorium**
Najpierw należy pobrać repozytorium projektu na lokalny komputer. Upewnij się, że masz zainstalowane `git`, Python oraz Node.js.

---

## **2. Konfiguracja plików `.env`**

### **Backend**
W katalogu `backend/backend` utwórz plik `.env` i dodaj następujące dane konfiguracyjne:
```plaintext
SECRET_KEY=                # Tajny klucz dla Django (możesz wygenerować losowy ciąg znaków)
POSTGRES_DB=               # Nazwa bazy danych PostgreSQL
POSTGRES_USER=             # Użytkownik bazy danych PostgreSQL
POSTGRES_PASSWORD=         # Hasło dla użytkownika bazy danych
POSTGRES_HOST=             # Adres hosta bazy danych (np. localhost)
POSTGRES_PORT=             # Port PostgreSQL (domyślnie 5432)
```

### **Frontend**

W katalogu `frontend` utwórz plik `.env` i dodaj następujące dane:

```plaintext
VITE_API_URL=              # URL backendu, np. http://localhost:8000/api
VITE_HOST=                 # Adres, na którym działa frontend, np. localhost
VITE_PORT=                 # Port, na którym działa frontend, np. 3000
```

### **Wyjaśnienie danych konfiguracyjnych**
- **SECRET_KEY**: Tajny klucz dla Django, który zapewnia bezpieczeństwo aplikacji. Możesz wygenerować losowy ciąg znaków.
- **POSTGRES_DB**: Nazwa bazy danych w PostgreSQL.
- **POSTGRES_USER**: Użytkownik, który ma dostęp do bazy danych.
- **POSTGRES_PASSWORD**: Hasło dla użytkownika bazy danych.
- **POSTGRES_HOST**: Host bazy danych. Jeśli działa lokalnie, wpisz `localhost`.
- **POSTGRES_PORT**: Port bazy danych, zwykle `5432`.
- **VITE_API_URL**: Adres backendu, z którym komunikuje się frontend (np. `http://localhost:8000/api`).
- **VITE_HOST**: Adres, na którym frontend jest dostępny (np. `localhost`).
- **VITE_PORT**: Port, na którym działa frontend (np. `3000`).

---

## **3. Przygotowanie wirtualnego środowiska**
W katalogu głównym projektu utwórz wirtualne środowisko Pythona:
```bash
python3 -m venv env
source env/bin/activate
```

## **4. Instalacja zależności**

### **Backend**
Przejdź do katalogu `backend` i zainstaluj wymagane zależności:
```bash
cd backend
pip install -r requirements.txt
```

### **Frontend**
Zainstaluj Node.js (jeśli jeszcze go nie masz) i zainstaluj zależności dla Reacta. Przejdź do katalogu `frontend` i uruchom:
```bash
cd frontend
npm install
```

## **5. Przygotowanie bazy danych**
W katalogu `backend` wykonaj migracje bazy danych:
```bash
python manage.py makemigrations
python manage.py migrate
```

## **6. Uruchomienie aplikacji**

### **Uruchomienie backendu**
W katalogu `backend` uruchom serwer Django:
```bash
python manage.py runserver <adres_ip>:8000
```
Zamień `<adres_ip>` na adres swojego komputera lub wpisz localhost, np. 127.0.0.1:8000.

### **Uruchomienie frontendu**
W katalogu frontend uruchom środowisko developerskie Reacta:
```bash
npm run dev
```

## **7. Ważne uwagi**
- Upewnij się, że baza danych PostgreSQL jest skonfigurowana i działa.
- Backend działa na porcie `8000`, a frontend na porcie `3000` (domyślnie).

---

Po wykonaniu tych kroków aplikacja powinna być dostępna pod adresem podanym w konfiguracji frontendu (`VITE_HOST` i `VITE_PORT`).

Gotowe! 🎉
