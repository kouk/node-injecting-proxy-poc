var connect = require('connect'),
    httpProxy = require('http-proxy'),
    through = require('through'),
    url = require('url'),
    utils = require('./proxy_util'),
    conf = require('./config'),
    app = connect();


selects = []
conf.get('replace').forEach(function(r){
    selects.push({
        query: r.select,
        func: function (node) {
            var ts = node.createStream({outer: false});
            ts.pipe(through(function(buf){
                this.queue(buf.toString().replace(r.from, r.to));
            })).pipe(ts);
        }
    });
});

conf.get('inject').forEach(function(i){
    var position = i.position || "end";
    selects.push({
        query: i.select,
        func: function(node){
            var ts = node.createStream();
            if (position != "end")
                ts.write(i.payload);
            ts.pipe(through(null, function(){
                console.log("Injecting into " + node.name);
                if (position == "end")
                    this.queue(i.payload);
                this.queue(null);
            })).pipe(ts);
        }
    });
});

selects.push({
    query: "link",
    func: function(node) {
        node.getAttribute('href', function(href) {
            if (!href)
                href='';
            node.setAttribute('href', utils.replaceHref(href));
        });
    }
});
selects.push({
    query: "script",
    func: function(node) {
        node.getAttribute('src', function(href) {
            if (!href)
                href='';
            node.setAttribute('src', utils.replaceHref(href));
        });
    }
});
selects.push({
    query: "a",
    func: function(node) {
        node.getAttribute('href', function(href) {
            if (!href)
                href='';
            node.setAttribute('href', utils.replaceHref(href));
        });
    }
});

app.use(require('harmon')([], selects));

var proxy = httpProxy.createServer();

proxy.on('proxyRes', function(proxyRes) {
    if (proxyRes.headers.location == undefined)
        return;
    proxyRes.headers.location = utils.replaceHref(proxyRes.headers.location);
    console.log("redirect to: " + proxyRes.headers.location);
});

app.use(
  function (req, res) {
    if (!req.headers.host)
        throw "Host header is missing";
    target = utils.createTarget(req.headers.host);
    console.log('proxying to ' + target);
    proxy.web(req, res, {
        target: target,
        headers: {
           host: url.parse(target).host
        }
    });
  }
);

module.exports = exports = app;