# Dockerfile para o frontend React
FROM node:18-alpine AS build
WORKDIR /app

# Copia package.json E .env PRIMEIRO
COPY package.json .
COPY .env .

RUN npm install

# Copia a pasta public e src para o build do React
COPY ./public ./public
COPY ./src ./src

# Build com as variáveis de ambiente do .env
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/build /usr/share/nginx/html
COPY default.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
