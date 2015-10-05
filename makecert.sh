#!/bin/sh

CN=${1:-proxy.livelocal}

if ! [ -f certificate.pem ] ; then
    mkdir -p demoCA/private demoCA/newcerts
    touch demoCA/index.txt
    echo "01" > demoCA/serial
    openssl req -x509 -new -newkey rsa:2048 -out demoCA/cacert.pem -keyout demoCA/private/cakey.pem -nodes -batch
    openssl req -new -subj "/CN=$CN" -newkey rsa:2048 -out req.pem -keyout key.pem -nodes -reqexts v3_req_livelocal -config openssl.cnf -nodes -batch
    openssl ca -in req.pem -config openssl.cnf -extensions v3_req_livelocal -policy policy_anything -batch
    cp demoCA/newcerts/01.pem certificate.pem
fi
