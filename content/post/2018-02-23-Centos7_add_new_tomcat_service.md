---
title: "How to add a new Tomcat service on CentOS7"
date: 2018-02-23T13:19:45+01:00
imageUrl: "https://i2.wp.com/www.mes-vms.fr/wp-content/uploads/2015/06/centos.jpg?resize=648%2C330&ssl=1"
tags: ["centos"]
categories: ["tips-and-tricks"]
comment: true
toc: false
autoCollapseToc: false
contentCopyright: false
---

Starting with version 7, CentOS is now using [systemd](https://freedesktop.org/wiki/Software/systemd/) as a service manager. 
Adding a new service is no longer done by creating a SH script in the `/etc/init.d` folder.

<!--more-->

- First, create a new file `/etc/systemd/system/tomcat.service` with the following content:

```text
[Unit]
Description=Tomcat
After=syslog.target network.target

[Service]
Type=forking
Environment=CATALINA_BASE=/usr/local/tomcat
Environment=CATALINA_PID=/var/run/tomcat/tomcat.pid
Environment=TOMCAT_HOME=/usr/local/apache-tomcat-8.0.45
ExecStart=/usr/local/apache-tomcat-8.0.45/bin/startup.sh
ExecStop='/usr/local/apache-tomcat-8.0.45/bin/shutdown.sh -force'
User=nobody
Group=nobody
UMask=0007
RestartSec=10
Restart=always

[Install]
WantedBy=multi-user.target
```

> We are using the `nobody` user to execute Tomcat.
> If there is the error ̀"This account is currently not available", that means the `nobody` user does not have a tty (/sbin/nologin).
>
> You will need to change the file `/etc/passwd` and put `/bin/bash` as the default tty for the `nobody` user:

```text
nobody:x:99:99:Nobody:/:/bin/bash
```

- Reload systemd:

```bash
sudo systemctl daemon-reload
```

- You can start the service with the following command:

```bash
sudo systemctl start tomcat
```

- You can enable the service so that the service will start up automatically on each reboot:

```bash
sudo systemctl enable tomcat
```

