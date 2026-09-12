# syntax=docker/dockerfile:1
# Multi-stage build for polyrhythmd. Builds natively on linux/arm64.

# ---------- Stage 1: build the React/Vite frontend to static files ----------
FROM node:22-alpine AS frontend-build
WORKDIR /build
COPY package.json package-lock.json ./
RUN npm ci
COPY index.html index.jsx vite.config.js ./
COPY public ./public
COPY src ./src
RUN npm run build

# ---------- Stage 2: static bundle, copied into a volume that Caddy serves ----------
FROM alpine:3.20 AS frontend
COPY --from=frontend-build /build/dist /dist
# Replace the volume contents atomically-ish: clear, then copy.
CMD ["sh", "-c", "rm -rf /www/polyrhythmd/* /www/polyrhythmd/.[!.]* 2>/dev/null; cp -r /dist/. /www/polyrhythmd/ && echo 'frontend published'"]

# ---------- Stage 3: install production deps for the Express API ----------
FROM node:22-alpine AS api-deps
WORKDIR /app
COPY service/package.json service/package-lock.json ./
RUN npm ci --omit=dev

# ---------- Stage 4: minimal API runtime ----------
FROM node:22-alpine AS api
ENV NODE_ENV=production PORT=3000
WORKDIR /app
COPY --from=api-deps /app/node_modules ./node_modules
COPY service/package.json service/index.js service/app.js service/database.js ./
USER node
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3000/api/health || exit 1
CMD ["node", "index.js"]
