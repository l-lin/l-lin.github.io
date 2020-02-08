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
#!/bin/bash
#######################################################
# This scripts is used to generate the rootCA and the #
# user bi-keys                                        #
#                                                     #
# Usage:                                              #
#           ./generate_certificate.sh                 #
#######################################################

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
    local certificate_name=$1

    info "${certificate_name} - Generate RSA private key"
    openssl genrsa -out ${certificate_name}/${certificate_name}.rsa.key 2048

    generateSelfSignedCertificate ${certificate_name} rsa

    info "${certificate_name} - Generate certificate signing request for our RSA certificate"
    openssl req -new \
            -key ${certificate_name}/${certificate_name}.rsa.key \
            -out ${certificate_name}/${certificate_name}.rsa.csr \
            -subj "${subject}${certificate_name}"

    info "${certificate_name} - Sign the RSA CSR using CA root key"
    openssl x509 -req \
            -in ${certificate_name}/${certificate_name}.rsa.csr \
            -CA ${rootca_home}/rootCA.pem \
            -CAkey ${rootca_home}/rootCA.key \
            -CAcreateserial \
            -out ${certificate_name}/${certificate_name}.rsa.crt \
            -days ${cert_validity} \
            -sha256
}

generateECDSA() {
    local certificate_name=$1

    info "${certificate_name} - Generate ECDSA private key"
    openssl ecparam -name prime256v1 -genkey -out ${certificate_name}/${certificate_name}.ecdsa.key

    generateSelfSignedCertificate ${certificate_name} ecdsa

    info "${certificate_name} - Generate certificate signing request for our ECDSA certificate"
    openssl req -new -nodes \
            -key ${certificate_name}/${certificate_name}.ecdsa.key \
            -out ${certificate_name}/${certificate_name}.ecdsa.csr \
            -subj "${subject}${certificate_name}"

    info "${certificate_name} - Sign the RSA CSR using CA root key"
    openssl x509 -req \
            -in ${certificate_name}/${certificate_name}.ecdsa.csr \
            -CA ${rootca_home}/rootCA.pem \
            -CAkey ${rootca_home}/rootCA.key \
            -CAcreateserial \
            -out ${certificate_name}/${certificate_name}.ecdsa.crt \
            -days ${cert_validity} \
            -sha256
}

generateSelfSignedCertificate() {
    local certificate_name=$1
    local certificate_type=$2

    info "${certificate_name}.${certificate_type} - Generate self-signed certificate"
    openssl req -new -x509 \
            -days ${cert_validity} \
            -key ${certificate_name}/${certificate_name}.${certificate_type}.key \
            -out ${certificate_name}/${certificate_name}.self-signed.${certificate_type}.crt \
            -subj "${subject}${certificate_name}"
}

generateUserCertificate () {
    local certificate_name=$1

    info "${certificate_name} - Delete existing files"
    rm -rf ${certificate_name}
    mkdir -p ${certificate_name}

    generateRSA ${certificate_name}
    generateECDSA ${certificate_name}
}

generateRootCA

generateUserCertificate "l.lin"
generateUserCertificate "localhost"

info "Generating CA and user certificates FINISHED!!!"

exit 0
```
