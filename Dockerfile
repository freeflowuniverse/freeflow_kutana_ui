FROM ubuntu:18.04 as builder

RUN apt update && apt upgrade -y
RUN apt install -y curl gnupg git

RUN curl -sS https://dl.yarnpkg.com/debian/pubkey.gpg | apt-key add -
RUN echo "deb https://dl.yarnpkg.com/debian/ stable main" | tee /etc/apt/sources.list.d/yarn.list

RUN curl -sL https://deb.nodesource.com/setup_14.x  | bash -

RUN apt update && apt install -y nodejs yarn

WORKDIR /app
COPY package.json package.json
COPY yarn.lock yarn.lock
RUN yarn install
COPY . .
RUN yarn build


FROM ubuntu:18.04

RUN apt update && apt upgrade -y
RUN apt install -y curl gnupg git vim nano

RUN curl -L https://nginx.org/keys/nginx_signing.key | apt-key add -

RUN echo "deb https://nginx.org/packages/mainline/ubuntu/ bionic nginx" | tee tee /etc/apt/sources.list.d/nginx.list
RUN echo "deb-src https://nginx.org/packages/mainline/ubuntu/ bionic nginx" | tee tee /etc/apt/sources.list.d/nginx.list

RUN apt update && apt install -y nginx

RUN mkdir /certs

COPY --from=builder /app/dist /usr/share/nginx/html
COPY --from=builder /app/certs /certs
COPY --from=builder /app/example.conf /etc/nginx/sites-available/default

COPY services.sh /services.sh
RUN chmod +x /services.sh

CMD /./services.sh