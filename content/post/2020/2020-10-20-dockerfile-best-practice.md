---
title: "Write secur and efficient Dockerfiles"
date: 2020-10-20T09:36:02+02:00
imageUrl: "https://i.ytimg.com/vi/Q5POuMHxW-0/maxresdefault.jpg"
tags: ["docker"]
categories: ["post"]
comment: true
toc: false
autoCollapseToc: false
contentCopyright: false
---

This post covers some best practices for building secure and efficient docker images.
This is not an exhaustive list, but covers most best practices for writing good enough secure &
efficient Dockerfiles.

<!--more-->

## Multi-stage builds

Multi-stage builds allow you to drastically reduce the size of your final image, without struggling
to reduce the number of intermediate layers and files.

Here an example of building a spring-boot maven project:

```
FROM openjdk:8-jdk-alpine as build

WORKDIR /workspace/app

COPY mvnw .
COPY .mvn .mvn
COPY pom.xml .
COPY src src

RUN ./mvnw install
# ----------------------
FROM openjdk:8-jdk-alpine

RUN addgroup -S app && adduser -S app -G app
USER app:app

COPY --from=build  /workspace/app/target/hello-world.jar /

ENTRYPOINT ["java","-jar","/hello-world.jar"]
```

This example first build the maven project and only copies the needed files to the final docker image.

## Leverage build cache

When building an image, Docker steps through the instructions in your Dockerfile, executing each in
the order specified. As each instruction is examined, Docker looks for an existing image in its cache
that it can reuse, rather than creating a new (duplicate) image.

So be sure to have the instructions that change the most at the bottom of the Dockerfile:

Do not do this:

```
COPY target/hello-world.jar .
# apk update will always trigger if the previous jar has been modified
RUN apk update
```

Do this instead:

```
RUN apk update
COPY target/hello-world.jar .
```

## Reduce the number of layers

Try if you reduce the number of layers in your image by minimizing the number of separate `RUN`
commands in your Dockerfile by consolidating multiple commands into a single `RUN` line.

So instead of:

```
RUN apk update
RUN apk install curl
```

Do:

```
RUN apk update && \
    apk add curl
```

## Use COPY instead of ADD

Although `ADD` and `COPY` are functionally similar, generally speaking, `COPY` is preferred. That's
because it's more transparent than `ADD` as the latter can point to a remote URL like
http://evilsource.com that is fetched at build time, whereas `COPY` use local files, in other
words resources you have control and checked.

## Avoid COPY all current folder files

Even if it's convenient, try to avoid doing this:

```
COPY . .
```

Instead, try to copy one file / folders at a time:

```
COPY mvnw .
COPY .mvn .mvn
COPY pom.xml .
COPY src src
```

The problem of copying the whole current folder is that developers may have put credentials in the
folder, like some `.credentials` for development purpose, which are then available in the Docker
image. And even if you delete the folder in the next Docker instruction, there are tools like
[dive](https://github.com/wagoodman/dive) that can check each layer of the Docker image.

## Verify binary checksum when possible

If you need to download a binary, be sure to verify the checksum if provided to ensure the file is
not corrupted during download or modified by a malicious third-party:

```bash
# using dive as example
RUN curl -L -o dive_0.9.2_linux_amd64.deb https://github.com/wagoodman/dive/releases/download/v0.9.2/dive_0.9.2_linux_amd64.deb &&
curl -L -o checksums.txt https://github.com/wagoodman/dive/releases/download/v0.9.2/dive_0.9.2_checksums.txt &&
echo "$(cat checksums.txt|grep deb|awk '{ print $1 }') dive_0.9.2_linux_amd64.deb" | sha256sum -c
# this will display "dive_0.9.2_linux_amd64.deb: OK" and returns 0 if it's alright
# otherwise it will print "sha256sum: standard input: no properly formatted SHA256 checksum lines found" and returns 1, thus stopping the docker build
```

## Do not upgrade your system packages

This might be a bit of a stretch but the reasoning is the following: you want to pin the version of
your software dependencies, if you do apt-get upgrade you will effectively upgrade them all to the
latest version.

If you do upgrade and you are using the latest tag for the base image, you amplify the
unpredictability of your dependencies tree.

What you want to do is to pin the base image version and just apt/apk update.

## Use non-root user

Root in a container is the same root as on the host machine, but restricted by the docker daemon
configuration. No matter the limitations, if an actor breaks out of the container he will still be
able to find a way to get full access to the host.

Create a user instead:

```
RUN addgroup -S bios && adduser -S bios -G bios
USER bios:bios
```

Here's [one example](https://americanexpress.io/do-not-run-dockerized-applications-as-root/#if-the-container-is-isolated-why-does-it-matter)
on why it matter to have a non-root user even if the container is isolated.

## Use Cloud Native Buildpacks

Buildpacks transform your application source code to images that can run on any cloud. Paketo
Buildpacks provide language runtime support for applications. They leverage the Cloud Native
Buildpacks framework to make image builds easy, performant, and secure.

See https://paketo.io/.

If you are using Spring Boot 2.3+, you can use its plugin to build the image with Maven or Gradle:

```bash
# with Maven
./mvnw spring-boot:build-image
# with Gradle
./gradlew bootBuildImage
```

It uses the local docker daemon (which therefore must be installed) but doesn't require a Dockerfile.

The image is built using Cloud Native Buildpacks, where the default builder is optimized for a
Spring Boot application (you can customize it but the defaults are useful). The image is layered
efficiently, like in the examples above. It also uses the CF memory calculator to size the JVM at
runtime based on the container resources available.

## Resources

- https://cloudberry.engineering/article/dockerfile-security-best-practices/
- https://docs.docker.com/develop/develop-images/dockerfile_best-practices/
- https://spring.io/guides/topicals/spring-boot-docker/
- https://cheatsheetseries.owasp.org/cheatsheets/Docker_Security_Cheat_Sheet.html
- https://paketo.io/

