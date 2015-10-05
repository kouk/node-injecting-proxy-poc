#!/bin/sh

CN=${1:-proxy.livelocal}

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
        openssl req -x509 -new -newkey rsa:2048 -out demoCA/cacert.pem -keyout demoCA/private/cakey.pem -nodes -batch
    fi
    openssl req -new -subj "/CN=$CN" -newkey rsa:2048 -out req.pem -keyout key.pem -nodes -reqexts v3_req_livelocal -config openssl.cnf -nodes -batch
    openssl ca -in req.pem -config openssl.cnf -extensions v3_req_livelocal -policy policy_anything -batch
    cp demoCA/newcerts/${SERIAL}.pem certificate.pem
fi

