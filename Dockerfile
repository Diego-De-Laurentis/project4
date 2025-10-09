# syntax=docker/dockerfile:1
FROM node:20-alpine AS deps
WORKDIR /app
COPY api-atlas/package*.json ./api-atlas/
RUN cd api-atlas && npm install --production

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# 1) Kopiere den gesamten Repo-Inhalt (statische Files egal wo sie liegen)
COPY . .

# 2) API-Node-Modules aus deps reinziehen
COPY --from=deps /app/api-atlas/node_modules ./api-atlas/node_modules

EXPOSE 8080
CMD ["node", "api-atlas/src/server.js"]
