---
title: "How to make a Docker application write to stdout"
date: 2021-04-23T14:25:55+02:00
featuredImage: ""
tags: ["docker"]
categories: ["post"]
toc:
  enable: false
---

<!--more-->

Some applications do not redirect their logs to the stdout but rather to some files. Hence, when
putting in a Docker image, the output of the docker logs doesn't display the logs of the
application.

In other cases, a docker image contains background processes and they are not attached to docker
log collector, i.e. performing `docker log <container_name>` does not display their content.

Having their logs displayed directly from the docker logs can be useful for various reasons:

- a simple `docker logs` will read the logs, instead of reading the log file in the container
- some tools leverages the docker logs to collect and aggregate into a logging system (e.g. ELK)

If the application is running as PID 1, we can create a symbolic link to `/dev/stdout` from the log
files that the application is writing to. The result will then not write into a file but go to
`stdout` and `stderr`.

Example of a Dockerfile that add this "hack":

```Dockerfile
FROM debian

# forward request and error logs to docker log collector
# assuming the app is producing logs into access.log and error.log
RUN ln -sf /dev/stdout /var/log/access.log \
  ln -sf /dev/stderr /var/log/error.log

CMD ["/app", "--not-logging-to-stdout"]
```

If the application is not running as PID 1, instead of `/dev/stdout`, we can use `/proc/1/fd/1`
instead.

Note: we could directly use `/proc/1/fd/1` for both cases, but I prefer the `/dev/stdout` syntax as
it's more understandable.

Source: https://serverfault.com/questions/599103/make-a-docker-application-write-to-stdout

