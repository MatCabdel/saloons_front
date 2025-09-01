FROM node:20-slim

WORKDIR /app
COPY package*.json angular.json tsconfig*.json ./
RUN npm install && npm install -g @angular/cli
EXPOSE 4200
CMD ["ng", "serve", "--host", "0.0.0.0"]
