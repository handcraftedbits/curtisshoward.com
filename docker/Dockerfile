FROM golang:alpine as build

ARG VERSION_HUGO=0.58.3

RUN apk update
RUN apk add git

RUN cd /tmp && \
  git clone https://github.com/gohugoio/hugo.git && \
  cd hugo && \
  git checkout v${VERSION_HUGO} && \
  go install

FROM alpine:edge

COPY --from=build /go/bin/hugo /usr/local/bin

RUN apk update
RUN apk add ca-certificates chromium freetype freetype-dev harfbuzz nodejs ttf-freefont yarn

RUN addgroup -S pptruser && \
  adduser -S -g pptruser pptruser && \
  mkdir -p /home/pptruser/Downloads && \
  chown -R pptruser:pptruser /home/pptruser

ENV HOME /tmp
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD true

EXPOSE 8080

VOLUME /work
WORKDIR /work

USER pptruser

ENTRYPOINT ["yarn"]
