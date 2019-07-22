---
title: "Nginx fallback"
date: 2019-07-19T16:44:41+02:00
imageUrl: "https://kinsta.com/wp-content/uploads/2018/03/what-is-nginx.png"
tags: ["nginx"]
categories: ["post"]
comment: true
toc: false
autoCollapseToc: false
contentCopyright: false

flowchartDiagrams:
  enable: true
  options: "{
              'font-color': 'white',
              'line-color': 'white',
              'element-color': 'white',
              'fill': 'black'
            }"
---

When developing multiple services that depends on other service, it's comfortable to have a dev
environment. I usually have a `docker-compose` file that mount a local environment. However, I do
not want to mount the whole ecosystem locally, just the services I'm currently developing.

By using Nginx, it's possible to configure a fallback in case the local service is not up.

<!--more-->

Here an example of the `nginx.conf` file that redirect HTTP to HTTPS and fallback to a dev
environment service if my local service is not up:

```
user  nginx;
worker_processes  1;

error_log  /var/log/nginx/error.log warn;
pid        /var/run/nginx.pid;

events {
  worker_connections 1024;
}

http {
  log_format  main  '$remote_addr - $remote_user [$time_local] "$request" '
  '$status $body_bytes_sent "$http_referer" '
  '"$http_user_agent" "$http_x_forwarded_for"';

  access_log  /var/log/nginx/access.log  main;

  sendfile        on;

  server {
    listen 80 default_server;
   	listen [::]:80 default_server;
   	server_name localhost;
    # redirect HTTP to HTTPS
   	return 301 https://$host$request_uri;
  }

  server {
    listen 443          ssl;
    server_name         localhost;
    ssl_certificate     /etc/nginx/certificates/localhost.crt;
    ssl_certificate_key /etc/nginx/certificates/localhost.key;
    ssl_protocols       TLSv1 TLSv1.1 TLSv1.2;
    ssl_ciphers         HIGH:!aNULL:!MD5;

    proxy_set_header Host $host;
    proxy_set_header X-Real-Ip $remote_addr;
    proxy_set_header X-Forwarded-For $remote_addr;
    proxy_set_header X-Forwarded-Proto $scheme;

    location / {
      root    /usr/share/nginx/html;
      index   index.html index.htm;
    }

    location /foobar {
      # Reverse proxy to local service
      proxy_pass http://localhost:8080;
      # if local service is not up, then use the one from the dev environment
      proxy_intercept_errors on;
      error_page 404 502 503 504 = @fallback;
    }

    location @fallback {
      # dev environment hostname
      proxy_set_header Host fallback.dev;
      proxy_pass https://fallback.dev;
    }
  }
}
```

```flowchart
st=>start: Start
e=>end: End
curl=>operation: curl -L https://localhost/foobar
cond=>condition: Local service up?
local=>operation: proxy to http://localhost:8080:foobar
dev=>operation: proxy to https://fallback.dev/foobar

st->curl(right)->cond
cond(yes, right)->local
cond(no)->dev
local->e
dev->e
```

Sources:

- https://stackoverflow.com/questions/55764444/nginx-fallback-to-try-files-when-proxy-pass-fails-requires-unusual-config
