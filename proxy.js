var fs = require('fs'),
    path = require('path'),
    connect = require('connect'),
    httpProxy = require('http-proxy'),
    through = require('through'),
    url = require('url'),
    _ = require('underscore'),
    utils = require('./lib/utils.js'),
    cookieParser = require('cookie-parser'),
    urlsafe_base64 = require('urlsafe-base64'),
    target_base32 = require('./lib/target_base32');

module.exports = exports = function(conf) {
    var app = connect(),
        proxyopts = {
            suffix: conf.get('suffix'),
            secure: conf.get('secure'),
            cookie_prefix: conf.get('cookie_prefix'),
            mask_redirect: conf.get('mask_redirect'),
            proto_separator: conf.get('proto_separator'),
            context: conf.get('context')
        },
        timeout = conf.get('timeout'),
        proxyserveropts = {
            secure: false,
        };

    if (timeout && timeout > 0) {
        proxyserveropts.proxyTimeout = timeout;
    }

    app.use( function (req, res, next) {
        res._proxy = new utils.ProxyData(req, res, proxyopts);
        next();
    });

    app.use(cookieParser());
    _.uniq(conf.get('targets')).forEach(function(t) {
        var constructor = require('./lib/target_' + t);
        target = new constructor(proxyopts);
        app.use(target.middleware.bind(target));
    });

    selects = [];
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
            func: function(node, req, res){
                if (res._proxy.redirecting === true)
                    return;
                var ts = node.createStream(),
                    context = _.extend({}, res._proxy.context) ;
                if (i.context)
                    _.extend(context, i.context);
                var data = i.payload(context);
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
                    throw "href empty";
                href = res._proxy.replace_href(
                    href, {deactivate_external: conf.get('deactivateExternal')});
                node.setAttribute('href', href);
            });
        }
      });

    app.use(require('harmon')([], selects, true));

    var proxy = httpProxy.createServer();

    // Listen for the `error` event on `proxy`.
    proxy.on('error', function (err, req, res) {
      _.find(conf.get('error_handlers'), function(t) {
        return require('./lib/error_' + t)(err, req, res, conf);
      });
      res.end();
    });

    proxy.on('proxyReq', function(proxyReq, req, res) {
      if (proxyReq._headers.referer) {
        proxyReq._headers.referer = res._proxy.target + req.url;
      }
      if (proxyReq._headers.origin) {
        proxyReq._headers.origin = res._proxy.target;
      }
    });

    proxy.on('proxyRes', function(proxyRes, req, res) {
        var hdrs = proxyRes.headers,
            proxydata = res._proxy;
            new_cookies = [];
        conf.get('hidden_headers').forEach(function(h) {
            delete hdrs[h.toLowerCase()];
        });
        var newurl = res._proxy.handle_redirect(proxyRes);
        if (newurl && proxyopts.mask_redirect) {
          var payload = '<script type="text/javascript">window.location="' + newurl + '";</script>',
              contentlen = proxyRes.headers['content-length'];
          if (!contentlen) contentlen = '0';
          proxyRes.headers['content-length'] = parseInt(contentlen) + payload.length;
          proxydata.redirecting = true;
          proxyRes.on('end', function () {
              res.write(payload);
          });
        }
        if (hdrs['set-cookie'] !== undefined)
          hdrs['set-cookie'] = _.map(hdrs['set-cookie'], proxydata.mangle_outgoing_cookie, proxydata);
    });

    app.use(
      function (req, res, next) {
        if (!res._proxy.target)
            throw "Invalid request";
        console.log('proxying to ' + res._proxy.target);
        proxy.web(req, res, _.extend({}, proxyserveropts, {
            target: res._proxy.target,
            headers: {
               host: url.parse(res._proxy.target).host
            }
        }));
      }
    );
    return app;
};
