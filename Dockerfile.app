FROM node:alpine AS build
WORKDIR /app

ARG BUILD_CONFIGURATION=production

COPY package.json ./
RUN npm install
COPY . ./
RUN npx ng build --configuration=${BUILD_CONFIGURATION}

FROM nginx:alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
WORKDIR /usr/share/nginx/html
COPY --from=build /app/dist/frontend/browser ./
EXPOSE 80
