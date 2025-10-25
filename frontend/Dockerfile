# Dockerfile para o frontend React
FROM node:18-alpine as build
WORKDIR /app
COPY package.json .
COPY .env .
RUN npm install

# Copia a pasta public e src para o build do React
COPY ./public ./public
COPY ./src ./src
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/build /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
