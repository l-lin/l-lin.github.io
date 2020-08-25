---
title: "Some tips and tricks in Docker Compose"
date: 2020-08-25T09:18:05+02:00
imageUrl: ""
tags: ["docker"]
categories: ["post"]
comment: true
toc: false
autoCollapseToc: false
contentCopyright: false
---



<!--more-->

## Alias and anchors

Anchors and aliases let you identify an item with an anchor in a YAML document, and then refer to
that item with an alias later in the same document. Anchors are identified by an `&` character, and
aliases by an `*` character.

The following example will start up 3 nginx servers with the same volumes in ports 80, 81 and 82.

```yaml
version: '3'
services:
  web1: &web
    image: nginx
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./templates:/etc/nginx/templates
    port:
      - 80:80
  web2:
    <<: *web
    port:
      - 81:80
  web3:
    <<: *web
    port:
      - 82:80
```

We can also use the prefix `x-` to set generic definition outside of the `services` definition. It
allows us to do something like this:

```yaml
version: '3'
# basic backend definition
x-backend: &function
  labels:
    backend: 'true'
  depends_on:
    - db
  networks:
    - backend
# deploy mode replicated
x-replicated:
  deploy:
    mode: replicated
    replicas: 3
# deploy mode global
x-global:
  deploy:
    mode: global

services:
  app1:
    <<: *x-backend
    <<: *x-replicated
    image: app1
  app2:
    <<: *x-backend
    <<: *x-global
    image: app2
```

## Scaling and port mapping

We can scale applications with the following commands:

```bash
docker-compose up --scale app1=3 --scale app2=4
```

However, if we want to bind ports to local ports, we need to set a range of ports instead in the
docker-compose.yml file:

```yaml
version: '3'
services:
  app1:
    image: app1
    ports:
      # app1 will start in a port from 8180 to 8199
      - "8180:8199:8080"
  app2:
    image: app2
    ports:
      # app2 will start in a port from 8280 to 8299
      - "8280:8299:8080"
```

