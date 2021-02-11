FROM node:alpine AS builder
WORKDIR /usr/src/app
RUN  chown node:node .
USER node
COPY package*.json ./
RUN  npm ci
COPY tsconfig*.json ./
COPY src src
RUN  npm run build

FROM node:alpine
ENV NODE_ENV=production
RUN apk add --no-cache tini
WORKDIR /usr/src/app
RUN chown node:node .
USER node
COPY --chown=node:node package*.json ./
RUN npm install --production
COPY --from=builder /usr/src/app/lib/ lib/
EXPOSE 3000
ENTRYPOINT [ "/sbin/tini","--", "node", "lib/index.js" ]
