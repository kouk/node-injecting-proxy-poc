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

If users are going to reach the proxy over SSL then the `secure` option must be added to `config.json`:

```
{
    'secure': true
}
```

This makes sure that href's and other link attributes get correctly rewritten
to start with `https://..`.

For certificate validation to work correctly you need the user facing web
server (such as apache or nginx) to respond with a wildcard SSL certificate for
the suffix TLD. Ask your friendly neighborhood CA for help with this. While
testing you can create a dummy wildcard certificate for the suffix TLD by
executing the `makecert.sh` script found in this distribution, then import the
`demoCA/cacert.pem` certificate in your browser or OS trusted CA list. If you
don't have nginx/apache and want the proxy itself to listen for HTTPS requests
then you need to add the following to your `config.json`:

```
{
    'port': 443,
    'ssl': true
}
```

The server expects `certificate.pem` and `key.pem` to exist in the current
working directory.
