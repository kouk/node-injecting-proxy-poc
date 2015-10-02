#!/bin/sh

if ! [ -f certificate.pem ] ; then
    openssl req -new -config ./openssl.cnf -nodes -keyout key.pem -out csr.pem -batch
    openssl req -x509 -days 365 -config ./openssl.cnf  -key key.pem -in csr.pem -out certificate.pem
fi
