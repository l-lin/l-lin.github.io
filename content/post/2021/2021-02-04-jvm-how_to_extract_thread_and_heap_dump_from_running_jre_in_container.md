---
title: "How to extract thread and heap dump from running JRE in container"
date: 2021-02-04T15:21:47+01:00
imageUrl: ""
tags: ["java"]
categories: ["post"]
comment: true
toc: false
autoCollapseToc: false
contentCopyright: false
---


<!--more-->

[jattach](https://github.com/apangin/jattach) is a utility to send commands to remote JVM.

```bash
# attach tty to the container
docker exec -it container sh

# for alpine image, install like this
apk add --no-cache jattach --repository http://dl-cdn.alpinelinux.org/alpine/edge/community/

# otherwise, you can download the binary
wget -L -O /usr/local/bin/jattach \
  https://github.com/apangin/jattach/releases/download/v1.5/jattach && \
  chmod +x /usr/local/bin/jattach

# generate heap dump
jattach 1 dumpheap container.hprof

# generate thread dump
jattach 1 threaddump > container.tdump

# go back to host
exit

# copy thread & heap dump to host
docker cp container:/container.hprof .
docker cp container:/container.tdump .

# use jconsole or visualvm to analyse the dumps
```

