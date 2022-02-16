FROM node:16.3.0-alpine as builder
WORKDIR /app
RUN apk add --no-cache  git
RUN apk add --no-cache python3 py3-pip

RUN apk add --update alpine-sdk && \
apk add libffi-dev openssl-dev && \
apk --no-cache --update add build-base

COPY package.json package.json
COPY yarn.lock yarn.lock
RUN yarn install
COPY . .
RUN yarn build


FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY --from=builder /app/example.conf /etc/nginx/conf.d/default.conf
CMD ["nginx", "-g", "daemon off;"]
