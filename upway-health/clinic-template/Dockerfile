FROM node:20-alpine

# Instalar OpenSSL requerido por Prisma en Alpine
RUN apk add --no-cache openssl

WORKDIR /app
COPY package.json ./
RUN npm install
COPY prisma ./prisma
RUN npx prisma generate
COPY tsconfig.json ./
COPY src ./src
RUN npx tsc
EXPOSE 3001
CMD ["node", "dist/server.js"]