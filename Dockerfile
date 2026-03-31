FROM node:22-alpine
WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

ENV REBUILD_TIMESTAMP=2026033102

RUN npm run build

EXPOSE 8080

CMD ["node", "server/index.js"]
