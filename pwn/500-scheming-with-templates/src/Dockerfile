FROM node:22-alpine
RUN apk add ucspi-tcp6 \
    && corepack enable pnpm

WORKDIR chal
COPY . .

RUN pnpm i

RUN adduser -g "CHAL" -D -H "chal" \
    && chown -R root:root /chal/* \
    && chmod -R 555 /chal/* \
    && passwd -l root

USER chal
EXPOSE 31337
CMD tcpserver -c 20 0 31337 node index.js
