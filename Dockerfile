# Use the official Node.js image based on Alpine as the base image
FROM node:20-alpine AS deploy-deps

# Use pnpm to manage dependencies
RUN npm install -g pnpm@9

# Files to go in /app directory
WORKDIR /app

# Copy dependency management files
COPY \
	package.json \
	pnpm-lock.yaml \
	tsconfig*.json \
	./

# Install dependencies
RUN	--mount=type=cache,id=pnpm-store,target=/root/.local/share/pnpm/store \
	pnpm install --frozen-lockfile

# Copy source code
COPY src/ ./src
COPY tsconfig*.json ./

ENTRYPOINT ["pnpm", "dev"]
