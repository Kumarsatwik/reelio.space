# Use a multi-stage build to reduce the final image size
FROM node:18-alpine AS base

# Install dependencies
RUN apk update && \
    apk upgrade && \
    apk add --no-cache ffmpeg && \
    rm -rf /var/cache/apk/*

# Set the working directory
WORKDIR /app

# Copy package.json and package-lock.json first to leverage Docker layer caching
COPY package.json package-lock.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY index.js .

# Set the command to run the application
CMD [ "npm", "start" ]