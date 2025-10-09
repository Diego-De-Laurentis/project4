FROM node:20-alpine
WORKDIR /app
COPY . .
RUN cd project4-userfix_project4-1/api-atlas && npm install --production
ENV NODE_ENV=production
EXPOSE 8080
CMD ["node","project4-userfix_project4-1/api-atlas/src/server.js"]
