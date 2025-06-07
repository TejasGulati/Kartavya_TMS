# Development stage
FROM node:18-alpine as development

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 5001

CMD ["npm", "run", "dev"]

# Production stage
FROM node:18-alpine as production

WORKDIR /app

COPY package*.json ./

RUN npm install --only=production

COPY . .

EXPOSE 5001

CMD ["node", "index.js"]