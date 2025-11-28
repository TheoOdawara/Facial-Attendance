FROM node:18-bullseye-slim

WORKDIR /usr/src/app

# Copy package files first to leverage Docker cache for dependencies
COPY package*.json ./

# Install temporary build tools so native modules (eg. bcrypt) can compile if needed.
# Then install dependencies with npm ci for reproducible builds and remove build tools.
RUN apt-get update \
	&& apt-get install -y --no-install-recommends python3 build-essential make g++ ca-certificates \
	&& npm ci --silent || npm install --silent \
	&& apt-get remove -y build-essential make g++ \
	&& apt-get autoremove -y \
	&& rm -rf /var/lib/apt/lists/*

# Copy application source
COPY . .

EXPOSE 3001

CMD ["npm", "start"]
