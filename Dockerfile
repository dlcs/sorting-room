FROM node:6.2.0

COPY . /srv/sorting-room

WORKDIR /srv/sorting-room

RUN npm install -g yarn grunt-cli

RUN yarn install

CMD ["grunt"]
