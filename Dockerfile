FROM node:22-alpine
WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy source code
COPY . .

# Build the React app
RUN npm run build

# Railway will assign PORT dynamically - do not set it here
# The server must listen on process.env.PORT
EXPOSE 8080

# Start the server
CMD ["node", "server/index.js"]
