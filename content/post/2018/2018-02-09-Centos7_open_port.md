---
title: "How to open firewall port on CentOS7"
date: 2018-02-09T16:56:55+01:00
imageUrl: "https://i2.wp.com/www.mes-vms.fr/wp-content/uploads/2015/06/centos.jpg?resize=648%2C330&ssl=1"
tags: ["centos"]
categories: ["post"]
comment: true
toc: false
autoCollapseToc: false
contentCopyright: false
---

<!--more-->

CentOS 7 is now using [Firewalld](https://fedoraproject.org/wiki/Firewalld) instead of iptables, so the commands are different if you want to open a port:

```bash
# Open port
firewall-cmd --zone=public --add-port=8080/tcp --permanent
# Reload firewall
firewall-cmd --reload
# Use this command to check the active zones
firewall-cmd --get-active-zones
```

