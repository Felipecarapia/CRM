FROM node:22-alpine
WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy source code
COPY . .

# Build the React app
RUN npm run build

# Railway dynamically assigns PORT - must use that port
ENV PORT=8080
EXPOSE 8080

# Start the server
CMD ["node", "server/index.js"]
