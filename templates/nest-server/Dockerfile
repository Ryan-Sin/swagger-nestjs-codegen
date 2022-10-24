# Base image
FROM node:16

# Create app directory
WORKDIR /app

# Bundle app source
COPY . .

# A wildcard is used to ensure both package.json AND package-lock.json are copied
COPY package*.json ./

# Installing the project dependencies
RUN npm install
RUN npm run build

# Port mapped to the docker daemon:
EXPOSE 3000
CMD ["bash", "start.sh"]
