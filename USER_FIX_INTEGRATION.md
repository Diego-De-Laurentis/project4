# User-Fix Integration (Atlas)
- API liegt in `api-atlas/`
- Setze `api-atlas/.env` (MONGODB_URI, JWT_SECRET, FRONTEND_ORIGIN)
- Starte: `cd api-atlas && npm install && node src/server.js`
- Endpunkte: /auth/register, /auth/login, /cart, /images
- Keine LocalStorage-Warenkörbe. Alles in MongoDB Atlas.
