#!/bin/sh

CADIR=demoCA
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
    reqext=v3_req
else
    reqext=v3_req_simple
fi
export REQUESTED_HOSTNAME REQUESTED_DOMAIN REQUESTED_CA_CN

if ! [ -f key.pem ] ; then
    mkdir -p $CADIR/private $CADIR/newcerts
    touch $CADIR/index.txt
    SERIAL="01"
    if ! [ -f $CADIR/serial ]; then
        echo "$SERIAL" > $CADIR/serial
    else
        SERIAL=$(cat $CADIR/serial)
    fi
    if ! [ -f $CADIR/private/cakey.pem ] ; then
        echo "Creating a new CA certificate.."
        openssl req -subj "/CN=$REQUESTED_CA_CN" -x509 -new -newkey rsa:2048 -out $CADIR/cacert.pem -keyout $CADIR/private/cakey.pem -nodes -batch -config openssl.cnf
    fi
    privkey=$CADIR/private/${SERIAL}.pem
    if [ -f $privkey ] ; then
        echo "Private key $privkey already exists!"
        exit 1
    fi
    openssl req -new -newkey rsa:2048 -out req.pem -keyout $privkey -nodes -config openssl.cnf -nodes -batch
    openssl ca -noemailDN -in req.pem -config openssl.cnf -extensions $reqext -policy policy_anything -batch
    echo "Created certificate $CADIR/newcerts/${SERIAL}.pem"
    echo "Private key: $CADIR/private/${SERIAL}.pem"
    rm req.pem
fi

