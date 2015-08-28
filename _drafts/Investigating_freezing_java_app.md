---
layout: post
title:  "Java - Investigating freezing Java apps" 
date:   2015-0+8-06
tags: [Random]
images: [tomcat.png]
---

* Check PostgreSQL connexions

```
$ sudo netstat -tanp | grep 5432
```

* Check the number of max active connexion in `server.xml`

* Check the number of ligthweigth process

```
$ ps -o nlwp <PID>
```

or

```
$ ps -eLf | grep java
```
