FROM  digirati/node8-npm5-alpine37

COPY . /srv/sorting-room

WORKDIR /srv/sorting-room

RUN apk add --no-cache yarn curl make gcc g++ python linux-headers binutils-gold && npm install -g grunt-cli http-server --unsafe-perm && yarn && npm rebuild node-sass --force && grunt dist

CMD http-server ./dist -p 3000