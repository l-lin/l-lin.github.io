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
we can use `openssl` & `keytool` command line to generate self-signed certificates.

<!--more-->

```bash
#!/usr/bin/env bash
#######################################################
# This scripts is used to generate the rootCA and the #
# user bi-keys                                        #
#######################################################

set -e

rootca_home="./root_ca"
validity=36500
out="$(pwd)"
name="localhost"
subject="/C=FR/ST=IDF/L=Paris/O=Foobar/OU=Engineering/CN="
password="super-secret-password"

show_help() {
  cat << EOF
Generate certificate

Usage: ${0##*/} <flags> <args>

Examples:
    # Generate RSA bi-keys
      ${0##*/} rsa
    # Create certificate with name "some.domain.name"
      ${0##*/} --name "some.domain.name" rsa
    # Using all flags
      ${0##*/} -n "some.domain.name" -s "/C=FR/ST=IDF/L=Paris/O=Foobar/OU=Engineering/CN=" -o "\$(pwd)/certificates" -p "S3cR3t" rsa

Available commands:
    rsa                   Generate CRT, KEY, P12 and JKS files with RSA algorithm
    ecdsa                 Generate CRT and KEY files with ECDSA algorithm

Flags:
    -h, --help            Display help
    -n, --name            Certificate name (default: ${name})
    -s, --subject         Certificate subject (default: ${subject})
    -o, --out             Output directory (default: ${out})

EOF
}

info() {
  echo -e "\033[0;36mINFO: ${1}\033[0m"
}

generate_root_ca() {
  local folder="${out}/${rootca_home}"
  if [ ! -d "${folder}" ]; then
    info "Generating the Certification Authority"
    mkdir -p "${folder}"

    # Since we do not have any certification authority, we will generate our own.
    openssl genrsa -out "${folder}/rootCA.key" 2048
    openssl req -new -nodes -x509 \
            -days ${validity} \
            -key "${folder}/rootCA.key" \
            -out "${folder}/rootCA.pem" \
            -subj "${subject}rootca"
  fi
}

generate_rsa() {
  local certificate_name=$1
  local folder="${out}/${certificate_name}"
  local rootca_folder="${out}/${rootca_home}"

  clean_folder "${certificate_name}" "rsa"

  info "${certificate_name} - Generate RSA private key"
  openssl genrsa -out "${folder}/${certificate_name}.rsa.key" 2048

  generate_self_signed_certificate "${certificate_name}" rsa

  info "${certificate_name} - Generate certificate signing request for our RSA certificate"
  openssl req -new \
          -key "${folder}/${certificate_name}.rsa.key" \
          -out "${folder}/${certificate_name}.rsa.csr" \
          -subj "${subject}${certificate_name}"

  info "${certificate_name} - Sign the RSA CSR using CA root key"
  openssl x509 -req \
          -in "${folder}/${certificate_name}.rsa.csr" \
          -CA "${rootca_folder}/rootCA.pem" \
          -CAkey "${rootca_folder}/rootCA.key" \
          -CAcreateserial \
          -out "${folder}/${certificate_name}.rsa.crt" \
          -days ${validity} \
          -sha256
}

generate_ecdsa() {
  local certificate_name=$1
  local folder="${out}/${certificate_name}"
  local rootca_folder="${out}/${rootca_home}"

  clean_folder "${certificate_name}" "ecdsa"

  info "${certificate_name} - Generate ECDSA private key"
  openssl ecparam -name prime256v1 -genkey -out "${folder}/${certificate_name}.ecdsa.key"

  generate_self_signed_certificate "${certificate_name}" ecdsa

  info "${certificate_name} - Generate certificate signing request for our ECDSA certificate"
  openssl req -new -nodes \
          -key "${folder}/${certificate_name}.ecdsa.key" \
          -out "${folder}/${certificate_name}.ecdsa.csr" \
          -subj "${subject}${certificate_name}"

  info "${certificate_name} - Sign the RSA CSR using CA root key"
  openssl x509 -req \
          -in "${folder}/${certificate_name}.ecdsa.csr" \
          -CA "${rootca_folder}/rootCA.pem" \
          -CAkey "${rootca_folder}/rootCA.key" \
          -CAcreateserial \
          -out "${folder}/${certificate_name}.ecdsa.crt" \
          -days ${validity} \
          -sha256
}

generate_p12() {
  local certificate_name=$1
  local folder="${out}/${certificate_name}"
  local rootca_folder="${out}/${rootca_home}"

  info "${certificate_name} - Generate the P12 with password '${password}'"
  openssl pkcs12 -export \
          -in "${folder}/${certificate_name}.rsa.crt" \
          -inkey "${folder}/${certificate_name}.rsa.key" \
          -out "${folder}/${certificate_name}.rsa.p12" \
          -password "pass:${password}"
}

generate_self_signed_certificate() {
  local certificate_name=$1
  local certificate_type=$2
  local folder="${out}/${certificate_name}"

  info "${certificate_name}.${certificate_type} - Generate self-signed certificate"
  openssl req -new -x509 \
          -days ${validity} \
          -key "${folder}/${certificate_name}.${certificate_type}.key" \
          -out "${folder}/${certificate_name}.self-signed.${certificate_type}.crt" \
          -subj "${subject}${certificate_name}"
}

clean_folder() {
  local certificate_name=$1
  local certificate_type=$2
  local folder="${out}/${certificate_name}"

  info "${certificate_name} - Delete existing ${certificate_type} files"
  mkdir -p "${folder}"
  if [ -f "${folder}/${certificate_name}.${certificate_type}.crt" ]; then
    for f in ${folder}/*.${certificate_type}.*; do
      rm "${f}"
    done
  fi
}

main() {
  # Flags in bash tutorial here: /usr/share/doc/util-linux/examples/getopt-parse.bash
  TEMP=$(getopt -o 'hn:s:p:o:' --long 'help,name:,subject:,password:,out:' -n "${0##*/}" -- "$@")
  eval set -- "$TEMP"
  unset TEMP
  while true; do
    case "${1}" in
      '-h'|'--help')
        show_help
        exit
        ;;
      '-n'|'--name')
        name="${2}"
        shift 2
        continue
        ;;
      '-s'|'--subject')
        subject="${2}"
        shift 2
        continue
        ;;
      '-p'|'--password')
        password="${2}"
        shift 2
        continue
        ;;
      '-o'|'--out')
        out="${2}"
        shift 2
        continue
        ;;
      '--')
        shift
        break
        ;;
      *)
        break
        ;;
    esac

    shift
  done

  case "${1}" in
    'rsa')
      generate_root_ca
      generate_rsa "${name}"
      generate_p12 "${name}"
      info "Certificate generation FINISHED!!!"
      ;;
    'ecdsa')
      generate_root_ca
      generate_ecdsa "${name}"
      info "Certificate generation FINISHED!!!"
      ;;
    'p12')
      generate_root_ca
      ;;
    *)
      show_help
      ;;
  esac
}

main "$@"
```

