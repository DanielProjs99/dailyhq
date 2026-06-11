# syntax = docker/dockerfile:1

# Node 22.x – wymagane przez node:sqlite (start z flagą --experimental-sqlite).
ARG NODE_VERSION=22
FROM node:${NODE_VERSION}-slim AS build

WORKDIR /app

# Najpierw manifesty – lepszy cache warstw instalacji zależności.
COPY package.json ./
COPY server/package.json ./server/
COPY client/package.json ./client/

# Instaluje zależności server + client (z devDependencies klienta – vite jest tu).
# UWAGA: w stage'u build NIE ustawiamy NODE_ENV=production, żeby devDeps się zainstalowały.
RUN npm run install:all

# Reszta kodu i build frontendu do client/dist
COPY . .
RUN npm run build --prefix client

# ── Obraz finalny ─────────────────────────────────────────
FROM node:${NODE_VERSION}-slim

ENV NODE_ENV=production
WORKDIR /app

# Gotowa aplikacja wraz z node_modules serwera i zbudowanym frontendem
COPY --from=build /app /app

EXPOSE 3000
CMD ["npm", "run", "start"]
