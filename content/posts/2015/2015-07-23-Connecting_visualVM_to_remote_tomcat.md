---
title: "How to connect VisualVM to a remote Tomcat"
date: 2015-07-23
featuredImage: "https://images.pexels.com/photos/241544/pexels-photo-241544.jpeg?w=1260&h=750&auto=compress&cs=tinysrgb"
tags: ["tomcat", "monitoring"]
categories: ["post"]
---

<!--more-->

* Add the following to the `JAVA_OPTS`:

```bash
export JAVA_OPTS="-Dcom.sun.management.jmxremote=true \
                  -Dcom.sun.management.jmxremote.port=9090 \
                  -Dcom.sun.management.jmxremote.ssl=false \
                  -Dcom.sun.management.jmxremote.authenticate=false \
                  -Djava.rmi.server.hostname=123.456.789.123"
```

Set your server IP on the `java.rmi.server.hostname`.

* On VisualVM, add a remote host
* Right click on the created host > Add JMX connexion
* Set the server IP with the port (in the example, it's 9090)
* ????
* PROFIT!!!
