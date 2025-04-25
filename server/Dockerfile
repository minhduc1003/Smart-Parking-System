FROM node:14

# Set the working directory
WORKDIR /usr/src/app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Expose the ports
EXPOSE 3000
EXPOSE 8080

# Command to run the application
CMD ["node", "app.js"]