---
title: "How to add CORS headers with Nginx"
date: 2020-10-31T16:59:51+01:00
featuredImage: "https://kinsta.com/wp-content/uploads/2018/03/what-is-nginx.png"
tags: ["nginx"]
categories: ["post"]
---

Sometimes, you cannot change an app to support CORS, so in order to support CORS, we can put a small
reverse proxy behind the app that will add the headers.

<!--more-->

Create a `app.conf` with the following:

```
upstream app {
  server localhost:1935;
}

map $http_origin $allow_origin {
  default "*";
  "~^https?://(somedomain\.xyz|localhost:8080)$" "$http_origin";
}

map $request_method $cors_method {
  default "allowed";
  "OPTIONS" "preflight";
}

map $cors_method $cors_max_age {
  default "";
  "preflight" 3600;
}

map $cors_method $cors_allow_methods {
  default "";
  "preflight" "GET, POST, OPTIONS";
}

map $cors_method $cors_allow_headers {
  default "";
  "preflight" "Authorization,Content-Type,Accept,Origin,User-Agent,DNT,Cache-Control,X-Mx-ReqToken,Keep-Alive,X-Requested-With,If-Modified-Since";
}

map $cors_method $cors_content_length {
  default $initial_content_length;
  "preflight" 0;
}

map $cors_method $cors_content_type {
  default $initial_content_type;
  "preflight" "text/plain charset=UTF-8";
}

server {
  listen 80;

  add_header Access-Control-Allow-Origin $allow_origin;
  add_header Access-Control-Allow-Credentials 'true';
  add_header Access-Control-Max-Age $cors_max_age;
  add_header Access-Control-Allow-Methods $cors_allow_methods;
  add_header Access-Control-Allow-Headers $cors_allow_headers;

  set $initial_content_length $sent_http_content_length;
  add_header 'Content-Length' "";
  add_header 'Content-Length' $cors_content_length;

  set $initial_content_type $sent_http_content_type;
  add_header Content-Type "";
  add_header Content-Type $cors_content_type;

  if ($request_method = 'OPTIONS') {
    return 204;
  }

  location / {
    proxy_pass http://app;
  }
}
```

Add the file to the `/etc/nginx/conf.d` folder.

With docker:

```bash
docker run -it --rm --network host -v ${PWD}/nginx.conf:/etc/nginx/conf.d/default.conf nginx
```

Sources:

- https://gist.github.com/Stanback/7145487
- https://enable-cors.org/server_nginx.html

