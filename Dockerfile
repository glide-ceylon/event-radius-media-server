# Use the Node.js LTS base image
FROM node:18

# Set the working directory
WORKDIR /usr/src/app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application files
COPY . .

# Ensure the FFmpeg binary is executable
RUN chmod +x ./ffmpeg/ffmpeg.exe

# Expose the required ports
EXPOSE 1935 8000

# Run the application
CMD ["node", "index.js"]
