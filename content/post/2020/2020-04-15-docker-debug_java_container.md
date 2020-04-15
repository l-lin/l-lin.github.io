---
title: "Debug Java container"
date: 2020-04-15T11:13:13+02:00
imageUrl: ""
tags: ["docker", "java"]
categories: ["post"]
comment: true
toc: false
autoCollapseToc: false
contentCopyright: false
---

Debugging a Java container is the same as debugging a remote Java application. All you need to do is
to add some arguments to the JVM, run the Java application and attach the debugger.

<!--more-->

## IDE

With your favorite IDE, create a new remote configuration:

{{< figure class="center" src="/images/2020-04-15/debug_java_container.png" alt="Remote configuration" title="Remote configuration" >}}

Copy the command line arguments.

## Docker container

We will use the following Docker image as an example:

```Dockerfile
FROM openjdk:11.0.6-jre-slim

EXPOSE 8180
WORKDIR /opt
COPY target/heart-beat-producer.jar /opt
ENTRYPOINT ["java", "-jar", "/opt/heart-beat-producer.jar"]
```

If we want to add the debug argument, we can override the entrypoint:

```bash
docker run -it --rm \
  --entrypoint java \
  -p 8180:8180 \
  -p 5005:5005 \
  linlouis/heart-beat-producer \
  -agentlib:jdwp=transport=dt_socket,server=y,suspend=n,address=*:5005 -jar /opt/heart-beat-producer.jar
```

Or if you are using docker compose:

```yaml
version: '3'
services:
  heart-beat-producer:
    image: linlouis/heart-beat-producer
    ports:
      - 8180:8180
      - 5005:5005
    entrypoint: ["java"]
    command: [
      "-agentlib:jdwp=transport=dt_socket,server=y,suspend=n,address=*:5005",
      "-jar",
      "/opt/heart-beat-producer.jar"
    ]
```

Now, you just need to run the remote debug from the IDE, add breakpoints then use your application.

Happy debugging!

