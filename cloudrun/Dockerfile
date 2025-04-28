FROM node:22-bullseye-slim

RUN apt-get -y update
RUN npm update -g npm

WORKDIR /usr/app

ADD index.js index.js
ADD package.json package.json
ADD package-lock.json package-lock.json
RUN npm install

CMD ["npm", "run", "start"]