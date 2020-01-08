FROM golang as build

ARG VERSION_HUGO=0.62.2

RUN apt-get update
RUN apt-get install -y git

RUN cd /tmp && \
  git clone https://github.com/gohugoio/hugo.git && \
  cd hugo && \
  git checkout v${VERSION_HUGO} && \
  go install

FROM node:current-slim

RUN apt-get update

RUN apt-get install -y fonts-liberation
RUN cd /tmp && \
  wget https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb && \
  apt-get install -y ./google-chrome-stable_current_amd64.deb && \
  rm *.deb
RUN apt-get update

COPY --from=build /go/bin/hugo /usr/local/bin

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD true

EXPOSE 8080

VOLUME /work
WORKDIR /work

ENTRYPOINT ["yarn"]
