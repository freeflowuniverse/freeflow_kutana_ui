FROM node:alpine as builder
WORKDIR /app
COPY package.json package.json
COPY yarn.lock yarn.lock
RUN yarn install
COPY . .
RUN yarn build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY --from=builder /app/example.conf /etc/nginx/conf.d/default.conf
CMD ["nginx", "-g", "daemon off;"]
