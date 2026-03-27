# ── Build stage ──────────────────────────────────────────────────────────────
FROM node:22-bookworm-slim AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# Bundle client TypeScript
RUN npm run build:client

# Compile server TypeScript
RUN npx tsc

# Drop dev dependencies
RUN npm prune --production

# ── Runtime stage ─────────────────────────────────────────────────────────────
FROM node:22-bookworm-slim AS runtime

WORKDIR /app

# Production node_modules (includes compiled better-sqlite3 .node file)
COPY --from=build /app/node_modules ./node_modules

# Compiled server JS
COPY --from=build /app/dist ./dist

# Static client files: HTML + esbuild bundles
COPY --from=build /app/client ./client

ENV PORT=3000
ENV NODE_ENV=production

EXPOSE 3000

CMD ["node", "dist/server/server.js"]
