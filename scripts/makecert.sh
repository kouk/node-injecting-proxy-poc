#!/bin/sh

if [ $# -eq 0 ] ; then
    echo "Usage: $0 host.domain"
    echo ""
    echo "Advanced:"
    echo "   $0 .domain host 'your ca common name'"
    exit 1
fi

REQUESTED_DOMAIN=$1
REQUESTED_HOSTNAME=$2
REQUESTED_CA_CN=$3

if [ -z "$REQUESTED_CA_CN" ] ; then
    REQUESTED_CA_CN="Demo CA $(date +%F)"
    if [ -n "$REQUESTED_DOMAIN" ] ; then
        REQUESTED_CA_CN="$REQUESTED_CA_CN ($REQUESTED_DOMAIN)"
    fi
fi

if [ -n "$REQUESTED_HOSTNAME" ] ; then
    REQUESTED_DOMAIN=.$REQUESTED_DOMAIN
fi
export REQUESTED_HOSTNAME REQUESTED_DOMAIN REQUESTED_CA_CN

if ! [ -f certificate.pem ] ; then
    mkdir -p demoCA/private demoCA/newcerts
    touch demoCA/index.txt
    SERIAL="01"
    if ! [ -f demoCA/serial ]; then
        echo "$SERIAL" > demoCA/serial
    else
        SERIAL=$(cat demoCA/serial)
    fi
    if ! [ -f demoCA/private/cakey.pem ] ; then
        echo "Creating a new CA certificate.."
        openssl req -subj "/CN=$REQUESTED_CA_CN" -x509 -new -newkey rsa:2048 -out demoCA/cacert.pem -keyout demoCA/private/cakey.pem -nodes -batch -config openssl.cnf
    fi
    openssl req -new -newkey rsa:2048 -out req.pem -keyout key.pem -nodes -config openssl.cnf -nodes -batch
    openssl ca -noemailDN -in req.pem -config openssl.cnf -extensions v3_req -policy policy_anything -batch
    cp demoCA/newcerts/${SERIAL}.pem certificate.pem
fi

