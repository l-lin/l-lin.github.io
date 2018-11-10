---
title: "Do not prompt password and enable remote access"
date: 2015-06-04
imageUrl: "https://www.virtual-dba.com/media/postgresql-database-services-remote-dba.png"
tags: ["postgresql"]
categories: ["post"]
comment: true
toc: false
autoCollapseToc: false
contentCopyright: false
---

<!--more-->

# Do not prompt password

Edit the file `/etc/postgresql/9.3/main/pg_hba.conf` and change the value from `peer` to `trust`:

```txt
# "local" is for Unix domain socket connections only
local   all             postgres                                trust

# IPv4 local connections:
host    all             all             0.0.0.0/0            trust
```

Restart the PostgreSQL service:

```bash
sudo service postgresql restart
```

# Enable remote access

Edit the file `/etc/postgresql/9.3/main/postgresql.conf`and look for the property `listen_addresses` and change its value to `'*'`:

```txt
listen_addresses = '*'
```

Restart the PostgreSQL service:

```bash
sudo service postgresql restart
```
