FROM  digirati/node8-npm5-alpine37

COPY . /srv/sorting-room

WORKDIR /srv/sorting-room

RUN apk add --no-cache yarn && npm install -g grunt-cli --unsafe-perm && yarn

CMD ["grunt dist"]
