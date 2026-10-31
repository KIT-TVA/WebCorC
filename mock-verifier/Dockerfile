FROM node:24-alpine
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev
COPY mock-verifier.js server.js description.json ./
EXPOSE 80
CMD ["node", "server.js"]
