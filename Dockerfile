# syntax=docker/dockerfile:1
FROM node:20-alpine AS deps
WORKDIR /app
COPY api-atlas/package*.json ./api-atlas/
RUN cd api-atlas && npm install --production
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=deps /app/api-atlas/node_modules ./api-atlas/node_modules
COPY api-atlas ./api-atlas
COPY index.html ./index.html
COPY styles.css ./styles.css
COPY script.js ./script.js
COPY img ./img
COPY content ./content
COPY admin project4-userfix_project4-1/admin
COPY auth project4-userfix_project4-1/auth
EXPOSE 8080
CMD ["node", "api-atlas/src/server.js"]
