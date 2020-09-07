FROM alpine:3.9

COPY . /app

WORKDIR /app

ENV SERVICE_USER nomad

RUN addgroup -S ${SERVICE_USER} \
    && adduser -S ${SERVICE_USER} -G ${SERVICE_USER} \
    && apk update \
    && apk upgrade \
    && apk add --no-cache dumb-init nodejs npm \
    && rm -rf /root/cache /var/cache/apk/* /root/.cache \
    && apk add --no-cache --virtual .node-dev-deps python make g++ gcc \
    && npm config set unsafe-perm true \
    && npm install \
    && apk del .node-dev-deps

ENV NODE_ENV=production

EXPOSE 3000

USER $SERVICE_USER

CMD ["./run.sh"]
