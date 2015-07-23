---
layout: post
title:  "Tomcat - Connecting VisualVM to a remote Tomcat" 
date:   2015-07-23
tags: [Random]
images: [tomcat.png]
---

* Add the following to the `JAVA_OPTS`:

```
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
