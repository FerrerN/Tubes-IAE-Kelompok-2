FROM node:18-alpine

# Set working directory
WORKDIR /usr/src/app

# Install dependencies terlebih dahulu (memanfaatkan Docker layer caching)
COPY package*.json ./
RUN npm install --omit=dev

# Copy source code
COPY . .

# Expose port API
EXPOSE 4000

# Jalankan server
CMD ["node", "index.js"]
