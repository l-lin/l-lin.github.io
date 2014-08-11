---
layout: post
title: "Authentication using certificates, Tomcat and Spring security"
date: 2014-08-03
tags: [Tomcat]
images: [tomcat.png, java.png, spring.png]
---

Instead of the classic login/password way to access to a secured application, it's possible to authenticate through a certificate.
what's more, you can also attribute a `ROLE` to each certificate.
This tutorial will show you:
* how to activate the SSL secured by a certificate for our Tomcat
* how to secure the URL pattern with Spring Security
* how to access with a browser
* how to access with a third party application

In this tutorial, we will call `foobar` the application name.

# The basics

The principle is quite simple. It's a mutual verification:
The client check if the certificate given by the server is valid or not (through a certification authority that signs certificates).
The server also check the certificate given by the client.

![Certificate workflow]({{ site.url }}/images/certificate_workflow.png)
Credits to [http://blog.netapsys.fr/](http://blog.netapsys.fr/).

* The `keystores` store the private keys destinated to encrypt the data before emitting
* The `trustores` store the public keys destinated to identify the transmitter and then to decrypt their message

# SSL activation

## Generating the certificate

Let's generate the keystore that will be used by Tomcat by executing the following command:

```bash
keytool -genkey -v -alias tomcat -keyalg RSA -validity 3650 -keystore foobar.jks -dname "CN=foobar.local.fr, OU=Integration, O=foobar, L=Paris, ST=IDF, C=FR" -storepass foobarpwd -keypass foobarpwd
```
Adapt the parameters to your liking.

Then, generate the CSR to sign:

```bash
keytool -certreq -alias tomcat -file foobar.csr -keystore foobar.jks -storepass foobarpwd
```

Since we do not have any certification authority, we will generate our own.

```bash
openssl genrsa -out rootCA.key 1024
openssl req -new -x509 -days 3650 -key rootCA.key -out rootCA.crt -subj "/C=FR/ST=IDF/L=Paris/O=oodrive/OU=Integration/CN=local.fr"
mkdir -p demoCA/newcerts
touch demoCA/index.txt
echo '01' > demoCA/serial
```

Sign the certificate to the CA:

```bash
openssl ca -batch -keyfile rootCA.key -cert rootCA.crt -policy policy_anything -out localhost.crt -infiles foobar.csr
```

Add the root certificate tot the keystores

```bash
keytool -importcert -alias foobarrootca -file rootCA.crt -keystore foobar.jks -storepass foobarpwd -noprompt
```

Create the trustore with the root certificate in it

```bash
keytool -import -keystore cacerts.jks -storepass cacertspassword -alias rootca -file rootCA.crt -noprompt
```

## Configuring with Tomcat

```xml
<Connector
        protocol="HTTP/1.1"
        port="8443" maxThreads="200"
        scheme="https" secure="true" SSLEnabled="true"
        keystoreFile="/path/to/foobar.jks" keystorePass="epaymentpassword"
        truststoreFile="/path/to/cacerts.jks" truststorePass="cacertspassword"
        clientAuth="false" sslProtocol="TLS"/>
```

## Add dependency to Spring security with Maven

```xml
<dependency>
    <groupId>org.springframework.security</groupId>
    <artifactId>spring-security-web</artifactId>
	<version>4.0.3.RELEASE</version>
</dependency>
<dependency>
    <groupId>org.springframework.security</groupId>
    <artifactId>spring-security-config</artifactId>
	<version>4.0.3.RELEASE</version>
</dependency>
```

## Configuring Spring security

# Accessing with a browser

## Generating the certificate and allow access

## Import certificate

# Accessing with an another web application

## Generating the certificate and allow access
