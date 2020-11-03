FROM node:10.22.1-buster

RUN useradd -ms /bin/bash pybot
USER pybot
WORKDIR /home/pybot

COPY ./package.json .
RUN npm install

COPY . .

CMD [ "npm", "start" ]
