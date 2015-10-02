PoC injecting proxy
===================

Uses [node-http-proxy](https://github.com/nodejitsu/node-http-proxy/) and,
optionally, [dnsmasq](http://www.thekelleys.org.uk/dnsmasq/doc.html).

The server listens on a configurable port (by default 80) and proxies requests
to hosts under a dummy top level domain, e.g. `.http.livelocal` is proxied to
the corresponding host without the TLD. E.g. `http://google.com.http.livelocal`
to `http://google.com`. Https pages are proxied under `.https.livelocal`.

For this to work DNS must be configured with a wildcard DNS entry so that
anything under `.http.livelocal` and `.https.livelocal` is resolved to the
server running the proxy.

Quick start
-----------
Run:

```
npm install
cp config.js.sample config.js  # and edit
node server.js
```

This assumes you have already configured your DNS server(s) accordingly.

DNS configuration on OS X
-------------------------

The `bootstrap.sh`  script will try to configure [dnsmasq][] for you. If that
won't work for you you can do it manually, or use some other DNS configuration
tool.  Here's what to do for [dnsmasq][]:

```
brew install dnsmasq
```

Then create the default configuration (as root):

```
cnf=/usr/local/opt/dnsmasq/dnsmasq.conf
cp ${cnf}.example $cnf
echo "address=/.livelocal/127.0.0.1" >> $cnf
cp -fv /usr/local/opt/dnsmask/*.plist /Library/LaunchDaemons
chown root !$/homebrew.mxcl.dnsmasq.plist
launchctl load !$
```

Then configure OS X to use this resolver:

```
mkdir -p /etc/resolver
echo "nameserver 127.0.0.1" > /etc/resolver/livelocal
```

Now you should be able to resolve anything under the dummy `.livelocal` TLD.


SSL Support
-----------

In order for the proxy to listen for HTTPS requests, you first need to create a
wildcard certificate for the dummy TLD. For testing purposes you can execute
these commands to create a self signed certificate for the proxy, or simply
execute the `makecert.sh` script in this distribution:


```
openssl req -new -config ./openssl.cnf -nodes -keyout key.pem -out csr.pem -batch
openssl req -x509 -days 365 -config ./openssl.cnf  -key key.pem -in csr.pem -out certificate.pem
```

Then you need to add the following to your `config.json`:

```
{
    'port': 443,
    'secure': true
}
```

Restart the server.
