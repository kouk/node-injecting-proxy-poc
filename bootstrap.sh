#!/bin/sh

cnf=/usr/local/etc/dnsmasq.conf

if ! brew list | grep -q dnsmasq ; then
    brew install dnsmasq
    sudo cp /usr/local/opt/dnsmasq/dnsmasq.conf.example $cnf
    sudo cp -fv /usr/local/opt/dnsmasq/*.plist /Library/LaunchDaemons
    sudo chown root /Library/LaunchDaemons/homebrew.mxcl.dnsmasq.plist
    sudo launchctl load /Library/LaunchDaemons/homebrew.mxcl.dnsmasq.plist
fi
rule='address=/.livelocal/127.0.0.1'
if ! grep -q "^$rule" $cnf ; then
    echo "$rule" >> $cnf
    sudo brew services restart dnsmasq
fi

sudo mkdir -p /etc/resolver
if ! [ -f /etc/resolver/livelocal ] ; then
    target="$(dirname $0)/resolver.txt"
    if ! [ -f $target ] ; then
        echo "nameserver 127.0.0.1" > $target
    fi
    (cd /etc/resolver; sudo ln -s $target livelocal)
fi
