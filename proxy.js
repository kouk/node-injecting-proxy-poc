var connect = require('connect'),
    httpProxy = require('http-proxy'),
    through = require('through'),
    url = require('url'),
    _ = require('underscore'),
    utils = require('./proxy_util');

module.exports = exports = function(conf) {
    var app = connect(),
        proxyopts = {
            suffix: conf.get('suffix'),
            secure: conf.get('secure'),
            deactivate_external: conf.get('deactivateExternal')
        };

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
                var ts = node.createStream(),
                    data = i.payload(conf.get('context'));
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
                    node.setAttribute('href', utils.replaceHref(href, res, proxyopts));
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
                node.setAttribute('src', utils.replaceHref(src, res, proxyopts));
            });
        }
    });
    selects.push({
        query: "base",
        func: function(node, req, res) {
            node.getAttribute('href', function(href) {
                if (!href)
                    return;
                node.setAttribute('href', utils.replaceHref(href, res, proxyopts));
            });
        }
    });
    selects.push({
        query: "a[href]",
        func: function(node, req, res) {
            node.getAttribute('href', function(href) {
                if (!href)
                    throw "href empty"
                node.setAttribute('href', utils.replaceHref(href, res, proxyopts));
            });
        }
      });

    app.use(require('harmon')([], selects, true));

    var proxy = httpProxy.createServer();

    proxy.on('proxyRes', function(proxyRes, req, res) {
        conf.get('hidden_headers').forEach(function(h) {
            var h = h.toLowerCase();
            delete proxyRes.headers[h];
        });
        if (proxyRes.headers.location != undefined) {
            var opts = _.extend({}, proxyopts, {deactivate_external: false});
            proxyRes.headers.location = utils.replaceHref(proxyRes.headers.location, res, opts);
            console.log("redirect to: " + proxyRes.headers.location);
        }
    });

    app.use(
      function (req, res) {
        if (!req.headers.host)
            throw "Host header is missing";
        console.log("request for: " + req.headers.host + req.url);
        target = utils.createTarget(req.headers.host, proxyopts);
        if (!target)
            throw "Invalid request";
        res['_proxy_target'] = target;
        res['_proxy_req'] = req;
        console.log('proxying to ' + target);
        proxy.web(req, res, {
            target: target,
            secure: false,
            headers: {
               host: url.parse(target).host
            }
        });
      }
    );
    return app;
};
