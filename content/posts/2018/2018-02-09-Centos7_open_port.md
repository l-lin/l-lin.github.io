---
title: "How to open firewall port on CentOS7"
date: 2018-02-09T16:56:55+01:00
featuredImage: ""
tags: ["centos"]
categories: ["post"]
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

