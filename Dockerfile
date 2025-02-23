# Use the official Node.js image from the Docker Hub
FROM node:alpine

# Set the working directory in the container
WORKDIR /app

# Copy the package.json and package-lock.json files into the container
COPY package*.json ./

# Install the dependencies
RUN npm install

# Copy the rest of the application code into the container
COPY . .

# Expose the port the app runs on
EXPOSE 8000

# Command to run the application
CMD ["node", "server.js"]
