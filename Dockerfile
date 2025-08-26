FROM node:alpine as build
WORKDIR /app
COPY package.json ./
RUN npm install

COPY . ./
ENV npm_config_env=production
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist/frontend/browser /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
