# Menggunakan Node.js versi 18
FROM node:18.17.0

# Set working directory di dalam container
WORKDIR /app

# Copy package.json dan package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy seluruh kode backend ke dalam container
COPY . .

# Ekspos port yang digunakan oleh backend
EXPOSE 4000

# Command untuk menjalankan aplikasi backend
CMD ["npm", "start"]
