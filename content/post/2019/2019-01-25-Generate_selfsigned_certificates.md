---
title: "How to generate self-signed certificates"
date: 2019-01-25T16:03:35+01:00
imageUrl: ""
tags: ["ssh", "certificate"]
categories: ["post"]
comment: true
toc: false
autoCollapseToc: false
contentCopyright: false
---

When developing, we may need to use certificate. Instead of using Let's Encrypt or even pay for one,
we can use `openssl` command line to generate self-signed certificates.

<!--more-->

```bash
#######################################################
# This scripts is used to generate the rootCA and the #
# user bi-keys                                        #
#                                                     #
# Usage:                                              #
#           ./generate_certificate.sh                 #
#######################################################
#!/bin/bash

rootca_home="./rootCA"
rootca_validity=3650
cert_validity=500
subject="/C=FR/ST=IDF/L=Paris/O=Foobar/OU=R&D/CN="

info () {
    echo "[INFO] $1"
}

generateRootCA() {
    info "Generating the Certification authority"
    rm -rf  ${rootca_home}/*
    mkdir -p ${rootca_home}

    # Since we do not have any certification authority, we will generate our own.
    openssl genrsa -out ${rootca_home}/rootCA.key 2048
    openssl req -new -nodes -x509 \
            -days ${rootca_validity} \
            -key ${rootca_home}/rootCA.key \
            -out ${rootca_home}/rootCA.pem \
            -subj "${subject}rootca"
}

generateRSA() {
    local keystoreName=$1

    info "${keystoreName} - Generate RSA private key"
    openssl genrsa -out ${keystoreName}/${keystoreName}.rsa.key 2048

    info "${keystoreName} - Generate certificate signing request for our RSA certificate"
    openssl req -new \
            -key ${keystoreName}/${keystoreName}.rsa.key \
            -out ${keystoreName}/${keystoreName}.rsa.csr \
            -subj "${subject}${keystoreName}"

    info "${keystoreName} - Sign the RSA CSR using CA root key"
    openssl x509 -req \
            -in ${keystoreName}/${keystoreName}.rsa.csr \
            -CA ${rootca_home}/rootCA.pem \
            -CAkey ${rootca_home}/rootCA.key \
            -CAcreateserial \
            -out ${keystoreName}/${keystoreName}.rsa.crt \
            -days ${cert_validity} \
            -sha256
}

generateECDSA() {
    local keystoreName=$1

    info "${keystoreName} - Generate ECDSA private key"
    openssl ecparam -name prime256v1 -genkey -out ${keystoreName}/${keystoreName}.ecdsa.key

    info "${keystoreName} - Generate certificate signing request for our ECDSA certificate"
    openssl req -new -nodes \
            -key ${keystoreName}/${keystoreName}.ecdsa.key \
            -out ${keystoreName}/${keystoreName}.ecdsa.csr \
            -subj "${subject}${keystoreName}"

    info "${keystoreName} - Sign the RSA CSR using CA root key"
    openssl x509 -req \
            -in ${keystoreName}/${keystoreName}.ecdsa.csr \
            -CA ${rootca_home}/rootCA.pem \
            -CAkey ${rootca_home}/rootCA.key \
            -CAcreateserial \
            -out ${keystoreName}/${keystoreName}.ecdsa.crt \
            -days ${cert_validity} \
            -sha256
}

generateUserCertificate () {
    local keystoreName=$1

    info "${keystoreName} - Delete existing files"
    rm -rf ${keystoreName}
    mkdir -p ${keystoreName}

    generateRSA ${keystoreName}
    generateECDSA ${keystoreName}
}

generateRootCA

generateUserCertificate "l.lin"
generateUserCertificate "localhost"

info "Generating CA and user certificates FINISHED!!!"

exit 0
```
