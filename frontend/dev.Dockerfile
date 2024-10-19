FROM node:latest
WORKDIR /app
COPY package*.json /app/
RUN npm install
COPY ./ /app/
ENTRYPOINT ["npm", "run", "ng", "--", "serve", "--host", "0.0.0.0"]
