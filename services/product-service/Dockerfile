FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
COPY tsconfig.json ./

# Copy common library
COPY ../common ../common

RUN npm install

COPY . .

RUN npm run build

EXPOSE 4001

CMD ["npm", "start"]
