# **CashBoard Application Description**

## **1. Name and Purpose**
CashBoard is a web application that supports poker players in analyzing results, managing scoreboards, and generating detailed statistics.
- Games can only be created by an administrator.
- Users can log into the system using JWT tokens.
- After logging in, users see a summary screen of their earnings/losses and statistics, which are dynamically loaded from the backend.

Additionally, the platform includes a separate application that allows users to track their progress in watching TV series, enhancing their viewing experience by keeping organized and up-to-date with the episodes they have watched.
---

## **2. Application Structure**
The application is divided into two main parts: backend (Django) and frontend (React with Vite).

### **File Structure**
```plaintext
CashBoard/
├── backend/                             # Backend directory (Django)
│   ├── api/                             # API module: models, views, serializers
│   ├── op/                              # OP module: models, views, serializers to another application
│   ├── backend/                         # Main Django project configuration
│   │   ├── settings.py                  # Django configuration file
│   │   └── .env                         # .env file for backend (environment variables)
│   ├── manage.py                        # Django project management tool
│   ├── requirements.txt                 # Backend dependencies list
│   ├── Dockerfile                       # Docker image build file for backend
├── frontend/                            # Frontend directory (React + Vite)
│   ├── src/                             # Source code of the React application
│   ├── public/                          # Frontend static files
│   ├── Dockerfile                       # Docker image build file for frontend
│   ├── vite.config.js                   # Vite configuration for frontend
│   └── .env                             # .env file for frontend (environment variables)
├── nginx/                               # NGINX configuration directory
│   ├── nginx.conf                       # Main NGINX configuration file
│   └── ssl/                             # SSL certificates folder
├── docker-compose.yml                   # Docker Compose configuration file
└── .env                                 # Main file for environment variables
```

## **3. Technologies**
- **Frontend**:
  - Framework: React (`^18.3.1`)
  - Bundler: Vite (`^5.4.1`)
  - Dependencies: Defined in the `package.json` file.
  - API Address: Specified in the `.env` file.
  - Port: `:3000`

- **Backend**:
  - Language: Python (`3.12.6`)
  - Framework: Django (`5.1.1`)
  - API: Managed using Django REST Framework (DRF).
  - Dependencies: Defined in the `requirements.txt` file.
  - Port: `:8000`
  - Database: PostgreSQL.

---

## **4. Features**
1. **User Authentication**:
   - Login using JWT tokens.
   - API request protection through authorization.
2. **Scoreboards**:
   - Managed by the administrator.
   - Contain data about poker games.
3. **User Statistics**:
   - Analysis of earnings, losses, and other key indicators.
   - Dynamically loaded from the backend.
4. **REST API**:
   - Supports login, data management, and statistic retrieval.
5. **Email Notifications**:
   - Automated mailing system to send notifications and updates to users.
   - Uses Celery for asynchronous task management to ensure efficient operation.
   - Redis as a broker to handle message queues and task execution.

---

## **5. Security**
- Users are authenticated using JWT tokens.
- API address is hidden in the frontend `.env` file.
- Backend supports `.env` file for enhanced security.

## **6. Additional Information:**

- The code provided in this documentation refers to the development version of the application. It is configured for use in a development environment and may require adjustments for production use.
- If the mailing functionality is not available or if you do not wish to use email notifications, you must comment out the line in the API's `EndGameView` class that triggers the email sending task. Find and comment out the following line in your view implementation:
  ```python
  send_game_summary_email.delay(player.email, game_data, transactions)
  ```
  This will prevent the application from attempting to send an email summary when a game ends, which is necessary if the email backend is not configured or temporarily disabled.
---

# **Instructions for Running the CashBoard Application**

## **1. Download the Repository**
First, download the project repository to your local computer. Make sure you have `git`, Python, and Node.js installed.


## **2. Configuration of `.env` Files**
For the application to function correctly, you must configure the `.env` files.

### **Database**
In the main project directory, create a `.env` file:

```plaintext
POSTGRES_DB=cashboard_db   # Database name
POSTGRES_USER=cashboard_user # Database user
POSTGRES_PASSWORD=secure_password # Database password
```

### **Backend**
Go to the `backend/backend` directory and create a `.env` file:
```plaintext
SECRET_KEY=your_secret_key_here  # Generate a key using Django, e.g., `python -c 'from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())'`
DEBUG=True                       # Set `True` in development mode, `False` in production
POSTGRES_DB=your_database_name   # Database name
POSTGRES_USER=your_database_user # Database user
POSTGRES_PASSWORD=your_database_password # Database password
POSTGRES_HOST=your_database_host # Database service name in Docker Compose
POSTGRES_PORT=your_database_port # Default PostgreSQL port
ALLOWED_HOSTS=your_allowed_hosts # List of hosts/IPs that can serve the application
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend # Email backend
EMAIL_HOST=your_email_host       # Email service host, e.g., 'smtp.gmail.com'
EMAIL_PORT=your_email_port       # Port for email service
EMAIL_USE_TLS=True_or_False      # Whether to use TLS
EMAIL_HOST_USER=your_email_user  # Username for the email service
EMAIL_HOST_PASSWORD=your_email_password # Password for the email service
DEFAULT_FROM_EMAIL=your_default_from_email # Default email address to use for various automated correspondence
CELERY_BROKER_URL=your_celery_broker_url # URL of the Celery message broker, e.g., 'redis://localhost:6379/0'
YOUTUBE_API_KEY=your_youtube_api_key # API key for accessing the YouTube API
```
### **Frontend**

Go to the `frontend` directory and create a `.env` file:
```plaintext
VITE_API_URL=http://localhost:8000 # Backend API address
VITE_HOST=0.0.0.0                  # Frontend host
VITE_PORT=3000                     # Frontend port
```

## **3. Launch the Application with Docker Compose**
Launch all containers using Docker Compose:
```bash
docker-compose up -d
```

This command will start the following services:
- **db**: PostgreSQL – the database server, using PostgreSQL 15 Docker image, accessible on port 5432.
- **redis**: Redis – the caching and message broker service, using the latest Redis Docker image, accessible on port 6379.
- **backend**: Django with Gunicorn – the backend application built from the `./backend` directory, depends on both the `db` and `redis` services, accessible on port 8000.
- **celery**: Celery Worker – handles asynchronous tasks, built from the same context as the backend, running Celery worker with logging info level.
- **celery-beat**: Celery Beat – schedules periodic tasks, also built from the backend context, running Celery beat with logging info level.
- **frontend**: React with Vite – the frontend application built from the `./frontend` directory, accessible on port 3000.
- **nginx**: Nginx – serves as a reverse proxy for the frontend and backend, using the latest Nginx Docker image, configured via `./nginx/nginx.conf`, accessible on port 80.

Each service is configured to restart always, ensuring they recover from any crashes. The backend, Celery, and Celery Beat services share a common volume mounted from `./backend`, facilitating code sharing and persistence. Frontend development assets and Nginx are also set to use volumes for persistent storage and configuration.


---

## **4. Perform Database Migrations**
After the backend is first launched, you must perform database migrations.

1. Enter the backend container:
   ```bash
   docker exec -it django_backend bash
   ```
2. Execute the migrations and collect static files:
    ```bash
    python manage.py makemigrations
    python manage.py migrate
    python manage.py collectstatic --noinput   
    ```
3. (Optional) Create a superuser:
    ```bash
    python manage.py createsuperuser
    ```
4. Exit the container:
    ```bash
    exit
    ```

## **5. Verify the Application is Running**
- **Frontend**: Open in a browser at `http://localhost`.
- **Backend API**: Check the API at `http://localhost/api`.
- **Op application**: Check the OP at `http://localhost/op`.

---

## **6. Shutting Down the Application**
To stop the containers, use:
```bash
docker-compose down
```

## **Additional Options**
### **Checking Container Logs**
- **Container:**:
  ```bash
  docker logs container_name
  ```
### **Restarting the Application**
If you make changes, you can restart the containers:
  ```bash
  docker-compose restart
  ```

 
---

# **Unit Testing**
- **Frontend**:

  To run unit tests for the frontend part, navigate to the `frontend` directory and run the following command:
  ```bash
  npm run test
  ```
  Ensure you have all dependencies installed (`npm install`) before running the tests.
- **Backend**:
  
  To run unit tests for the backend part, make sure the backend container and the database are running. Then, in the terminal, execute the following command:
  ```bash
  docker-compose exec backend python manage.py test
  ```
  Remember that before running the tests, the container must be on, and the database correctly configured in the `docker-compose.yml` file and `.env` files.

## **Additional Information:**
- Frontend tests are run using Vitest (for Vite), and backend tests with Django's Test Framework.
- Backend tests require the container with the application and database to be running, so the tests can operate in a fully configured environment.
