---
title: "Using host DNS in Docker container with Ubuntu 18"
date: 2018-09-03T11:22:04+02:00
featuredImage: "https://i.ytimg.com/vi/Q5POuMHxW-0/maxresdefault.jpg"
tags: ["ubuntu", "docker"]
categories: ["post"]
---

Docker containers running in Ubuntu 18 can't resolve DNS as they are trying to use the default Google DNS server `8.8.8.8` as their DNS server.

<!--more-->

Since Ubuntu 18, the file `/etc/resolv.conf` is a symlink to `/run/systemd/resolve/stub-resolv.conf` (`systemd-resolved` is set as default on Ubuntu 18) and its content always contains the local ip `127.0.0.53`:

```bash
$ cat /etc/resolv.conf
nameserver 127.0.0.53
search somedomain.name
```

[By default](https://github.com/moby/moby/issues/23910#issuecomment-415576244), Docker reads `/etc/resolv.conf` and list all non-localhost IP. If the list is empty, then it uses google DNS servers `8.8.8.8` and `8.8.4.4`:

```bash
$ docker run -it --rm ubuntu:18.10 cat /etc/resolv.conf
search somedomain.name

nameserver 8.8.8.8
nameserver 8.8.4.4
```

That means your containers do not use your host DNS servers, thus, your internal URLs are not accessible inside your Docker containers.

## Forcing the host network

One way is to force the container to use the same network as the host by using the parameter `--network host`:

```bash
$ docker run --network host --rm ubuntu:18.10 cat /etc/resolv.conf
nameserver 127.0.0.53
search somedomain.name
```

## Setting the DNS server

Another way is to set your DNS server when running your containers

```bash
# First find what your DNS server is
$ nmcli dev show | grep 'IP4.DNS'
IP4.DNS[1]:                             192.168.4.1
$ docker run --dns 192.168.4.1 --rm ubuntu:18.10 cat /etc/resolv.conf
search somedomain.name
nameserver 192.168.4.1
nameserver 8.8.8.8
```

If you want to fix permanently without the need to set the DNS each time, you need to:

- create/edit the file `/etc/docker/daemon.json` and add your DNS server:

```json
{
  "dns": ["192.168.4.1", "8.8.8.8"]
}
```

- Restart your docker service:

```bash
sudo systemctl restart docker
```

Some sources:

- https://github.com/moby/moby/issues/23910
- https://askubuntu.com/questions/475764/docker-io-dns-doesnt-work-its-trying-to-use-8-8-8-8/826894
- https://development.robinwinslow.uk/2016/06/23/fix-docker-networking-dns/
- https://superuser.com/questions/1130898/no-internet-connection-inside-docker-containers
