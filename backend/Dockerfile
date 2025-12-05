FROM node:18-bullseye-slim

WORKDIR /usr/src/app


COPY package*.json ./

RUN apt-get update \
	&& apt-get install -y --no-install-recommends python3 build-essential make g++ ca-certificates \
	&& npm ci --silent || npm install --silent \
	&& apt-get remove -y build-essential make g++ \
	&& apt-get autoremove -y \
	&& rm -rf /var/lib/apt/lists/*


COPY . .

EXPOSE 3001

CMD ["npm", "start"]
