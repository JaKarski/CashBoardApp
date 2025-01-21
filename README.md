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
├── backend/                             # Katalog backendu (Django)
│   ├── api/                             # Moduł API: modele, widoki, serializery
│   ├── backend/                         # Główna konfiguracja projektu Django
│   │   ├── settings.py                  # Plik konfiguracji Django
│   │   └── .env                         # Plik .env dla backendu (zmienne środowiskowe)
│   ├── manage.py                        # Narzędzie do zarządzania projektem Django
│   ├── requirements.txt                 # Lista zależności backendu
│   ├── Dockerfile                       # Plik do budowania obrazu Dockera dla backendu
├── frontend/                            # Katalog frontendu (React + Vite)
│   ├── src/                             # Źródłowy kod aplikacji React
│   ├── public/                          # Statyczne pliki frontendu
│   ├── Dockerfile                       # Plik do budowania obrazu Dockera dla frontendu
│   ├── vite.config.js                   # Konfiguracja Vite dla frontendu
│   └── .env                             # Plik .env dla frontendu (zmienne środowiskowe)
├── nginx/                               # Katalog konfiguracji NGINX
│   ├── nginx.conf                       # Główny plik konfiguracji NGINX
│   └── ssl/                             # Folder dla certyfikatów SSL
├── docker-compose.yml                   # Plik konfiguracji Docker Compose
└── .env                                 # Plik główny dla zmiennych środowiskowych
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


## **2. Konfiguracja plików `.env`**
Aby aplikacja działała poprawnie, musisz skonfigurować pliki `.env`.

### **Baza danych**
W głownym katalogu projektu stwórz plik `.env`:

```plaintext
POSTGRES_DB=cashboard_db   # Nazwa bazy danych
POSTGRES_USER=cashboard_user # Użytkownik bazy danych
POSTGRES_PASSWORD=secure_password # Hasło do bazy danych
```

### **Backend**
Przejdź do katalogu `backend/backend` i utwórz plik `.env`:
```plaintext
SECRET_KEY=your_secret_key  # Wygeneruj klucz przy użyciu np. Django: `python -c 'from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())'`
DEBUG=True                 # Ustaw `True` w trybie development, `False` w produkcji
POSTGRES_DB=cashboard_db   # Nazwa bazy danych
POSTGRES_USER=cashboard_user # Użytkownik bazy danych
POSTGRES_PASSWORD=secure_password # Hasło do bazy danych
POSTGRES_HOST=db           # Nazwa usługi bazy danych w Docker Compose
POSTGRES_PORT=5432         # Domyślny port PostgreSQL
```
### **Frontend**

Przejdź do katalogu `frontend` i utwórz plik `.env`:
```plaintext
VITE_API_URL=http://localhost:8000 # Adres API backendu
VITE_HOST=0.0.0.0                  # Host frontendu
VITE_PORT=3000                     # Port frontendu
```

## **3. Uruchomienie aplikacji z Docker Compose**
Uruchom wszystkie kontenery za pomocą Docker Compose:
```bash
docker-compose up -d
```

To polecenie uruchomi następujące usługi:
- **db**: PostgreSQL – baza danych.
- **backend**: Django z Gunicorn – backend aplikacji.
- **frontend**: React z Vite – frontend aplikacji.
- **nginx**: Reverse proxy dla frontendu i backendu.

---

## **4. Wykonanie migracji bazy danych**
Po pierwszym uruchomieniu backendu musisz wykonać migracje bazy danych.

1. Wejdź do kontenera backendu:
   ```bash
   docker exec -it django_backend bash
   ```
2. Wykonaj migracje:
    ```bash
    python manage.py makemigrations
    python manage.py migrate
    ```
3. (Opcjonalnie) Utwórz użytkownika superadmina:
    ```bash
    python manage.py createsuperuser
    ```
4. Wyjdź z kontenera:
    ```bash
    exit
    ```

## **5. Sprawdzenie działania aplikacji**
- **Frontend**: Otwórz w przeglądarce `http://localhost`.
- **Backend API**: Sprawdź API na `http://localhost`.

---

## **6. Wyłączenie aplikacji**
Aby zatrzymać kontenery, użyj:
```bash
docker-compose down
```

## **Opcje dodatkowe**
### **Sprawdzenie logów kontenera**
- **Kontener**:
  ```bash
  docker logs nazwa_kontenera
  ```
### **Restart aplikacji**
Jeśli wprowadzasz zmiany, możesz zrestartować kontenery:
  ```bash
  docker-compose restart
  ```

 
---

# **Testy jednostkowe**
- **Frontend**:
  
  Aby uruchomić testy jednostkowe dla części frontendowej, przejdź do katalogu `frontend` i uruchom poniższą komendę:
  ```bash
  npm run test
  ```
  Upewnij się, że masz zainstalowane wszystkie zależności (`npm install`), zanim uruchomisz testy.
- **Backend**:
  
  Aby uruchomić testy jednostkowe dla części backendowej, upewnij się, że kontener z backendem oraz baza danych są uruchomione. Następnie, w terminalu, wykonaj poniższą komendę:
  ```bash
  docker-compose exec backend python manage.py test
  ```
  Pamiętaj, że przed uruchomieniem testów kontener musi być włączony, a baza danych poprawnie skonfigurowana w pliku `docker-compose.yml` oraz plikach `.env`.

## **Dodatkowe informacje:**
- Testy frontendowe są uruchamiane za pomocą Vitest (w przypadku Vite), a backendowe za pomocą Django's Test Framework.
- Testy backendowe wymagają kontenera z uruchomioną aplikacją oraz bazą danych, aby testy mogły działać na pełnym środowisku.
