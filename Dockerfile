FROM node:12
WORKDIR /usr/src/dbot
COPY package*.json ./
RUN npm ci
COPY . .
CMD ["npm", "start"]