FROM node:19 as base

WORKDIR /home/node/app

COPY package*.json ./

RUN npm i

COPY . .

USER node

CMD ["npm", "start"]