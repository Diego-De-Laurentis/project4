Backend hinzugefügt, Frontend unverändert.
Start lokal:
  1) cd api-atlas && cp .env.example .env  # Werte setzen: MONGODB_URI, DB_NAME, JWT_SECRET, COOKIE_SECURE
  2) npm install
  3) npm start
Service läuft auf http://localhost:8080, API unter /api/*, Health /healthz.
Docker (optional):
  docker build -f Dockerfile_backend -t project4 . && docker run -p 8080:8080 --env-file api-atlas/.env project4
