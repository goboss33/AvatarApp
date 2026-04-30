FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci

FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/init-db.js ./init-db.js

# RETIRE CETTE LIGNE :
# COPY --from=deps /app/node_modules ./node_modules

# AJOUTE CES DEUX LIGNES À LA PLACE :
# On copie le package.json pour que npm sache quoi installer
COPY package.json ./ 
# On installe bcryptjs (et postgres si tu utilises "pg" dans init-db.js)
RUN npm install bcryptjs pg

RUN chown -R nextjs:nodejs /app

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["sh", "-c", "node init-db.js && node server.js"]
