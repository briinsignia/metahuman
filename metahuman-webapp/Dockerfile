# Step 1: Set up the Node.js base image
FROM node:20-alpine

# Step 2: Create a directory for the application
WORKDIR /app

# Step 3: Copy over package files and install dependencies
COPY package*.json ./
RUN npm install

# Step 4: Copy application files
COPY . .

# Step 5: Build application for production
RUN npm run build

# Step 6: Specify the port number that needs to be exposed
EXPOSE 4080

# Step 7: Run the Next.js server
CMD [ "npm", "start" ]