FROM node:18-alpine AS base

WORKDIR /app

# Backend build
FROM base AS backend-build
COPY backend/package*.json ./backend/
WORKDIR /app/backend
RUN npm ci
COPY backend/ .
RUN npx prisma generate
RUN npm run build

# Production
FROM base AS production
WORKDIR /app/backend
COPY --from=backend-build /app/backend/dist ./dist
COPY --from=backend-build /app/backend/node_modules ./node_modules
COPY --from=backend-build /app/backend/package*.json ./
COPY --from=backend-build /app/backend/prisma ./prisma

ENV NODE_ENV=production
EXPOSE 3001

CMD ["npm", "start"]
