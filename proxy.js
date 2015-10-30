var connect = require('connect'),
    httpProxy = require('http-proxy'),
    through = require('through'),
    url = require('url'),
    _ = require('underscore'),
    utils = require('./lib/utils.js'),
    cookieParser = require('cookie-parser'),
    target_base32 = require('./lib/target_base32');

module.exports = exports = function(conf) {
    var app = connect(),
        proxyopts = {
            suffix: conf.get('suffix'),
            secure: conf.get('secure'),
            cookie_prefix: conf.get('cookie_prefix'),
            context: conf.get('context')
        };
    app.use( function (req, res, next) {
        res['_proxy'] = new utils.ProxyData(req, res, proxyopts);
        next();
    });

    app.use(cookieParser());
    _.uniq(conf.get('targets')).forEach(function(t) {
        var middleware = require('./lib/target_' + t).middleware(proxyopts);
        app.use(function(req, res, next) {
          if (!res._proxy.target)
            middleware(res._proxy);
          next();
        });
    });

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
            func: function(node, req){
                var ts = node.createStream();
                var data = i.payload(req._proxy.context);
                if (position != "end")
                    ts.write(data);
                ts.pipe(through(null, function(){
                    console.log("Injecting into " + node.name);
                    if (position == "end")
                        this.queue(data);
                    this.queue(null);
                })).pipe(ts);
            }
        });
    });

    selects.push({
        query: "link",
        func: function(node, req, res) {
            node.getAttribute('rel', function(rel) {
                if (rel.indexOf('icon') >= 0)
                    return;
                node.getAttribute('href', function(href) {
                    if (!href)
                        return;
                    href = res._proxy.replace_href(href, {deactivate_external: false});
                    node.setAttribute('href', href);
                });
            });
        }
    });
    selects.push({
        query: "script",
        func: function(node, req, res) {
            node.getAttribute('src', function(src) {
                if (!src)
                    return;
                src = res._proxy.replace_href(src, {deactivate_external: false});
                node.setAttribute('src', src);
            });
        }
    });
    selects.push({
        query: "base",
        func: function(node, req, res) {
            node.getAttribute('href', function(href) {
                if (!href)
                    return;
                href = res._proxy.replace_href(href, {deactivate_external: false});
                node.setAttribute('href', href);
            });
        }
    });
    selects.push({
        query: "a[href]",
        func: function(node, req, res) {
            node.getAttribute('href', function(href) {
                if (!href)
                    throw "href empty"
                href = res._proxy.replace_href(
                    href, {deactivate_external: conf.get('deactivateExternal')});
                node.setAttribute('href', href);
            });
        }
      });

    app.use(require('harmon')([], selects, true));

    var proxy = httpProxy.createServer();

    proxy.on('proxyRes', function(proxyRes, req, res) {
        var hdrs = proxyRes.headers;
        conf.get('hidden_headers').forEach(function(h) {
            var h = h.toLowerCase();
            delete hdrs[h];
        });
        if (hdrs.location != undefined) {
            hdrs.location = res._proxy.replace_href(hdrs.location);
            console.log("redirect to: " + hdrs.location);
        }
    });

    app.use(
      function (req, res) {
        if (!res._proxy.target)
            throw "Invalid request";
        console.log('proxying to ' + res._proxy.target);
        proxy.web(req, res, {
            target: res._proxy.target,
            secure: false,
            headers: {
               host: url.parse(res._proxy.target).host
            }
        });
      }
    );
    return app;
};
