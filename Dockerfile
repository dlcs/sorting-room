FROM node:6.2.0

RUN cd /srv/ && git clone https://github.com/dlcs/sorting-room.git
RUN cd /srv/sorting-room && git checkout alpha-mint

WORKDIR /srv/sorting-room

RUN npm install -g yarn
RUN npm install -g grunt-cli

RUN yarn install

CMD [ "grunt" ]
