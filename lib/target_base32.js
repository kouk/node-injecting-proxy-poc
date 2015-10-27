var S = require('string'),
    url = require('url'),
    utils = require('./utils'),
    base32 = require('base32');
module.exports = exports = function(conf) {
  var replaceHref = function (href, res, options) {
    var options = options || {secure: false, suffix: ''},
        r = url.parse(href, false, true),
        proto = options.secure ? 'https' : 'http',
        target_proto = r.protocol;
    if (!r.host) return href;
    if (!target_proto)
        target_proto = url.parse(res._proxy_req._proxy_target).protocol;
    r.host = base32.encode(r.host);
    r.host += "." + S(target_proto).chompRight(':');
    r.host += options.suffix;

    if (options.deactivate_external &&
        !res._proxy_req.headers.host.startsWith(r.host))
        return "javascript:void;"

    r.protocol = proto;
    return r.format();
  };
  var middleware = function(req, res, next) {
    if (req.headers.host) {
        var options = conf || {suffix: ''},
            host = req.headers.host,
            protohost = S(host).chompRight(options.suffix),
            proto = protohost.endsWith('.https') ? 'https' : 'http';
            host = protohost.chompRight('.' + proto).s;
        console.log(proto + " host requested: " + host)
        if (protohost == host) {
            console.log("Invalid proto and host (suffix: " + options.suffix + ")");
        } else {
            var original = base32.decode(host);
            console.log("decoded host: " + original);
            if (/^[A-Za-z0-9:.-]+$/.test(original)) {
                utils.set_proxy_target(req, proto + '://' + original);
                utils.set_href_replacer(req, replaceHref);
            }
        }
    }
    next();
  };
  middleware.replaceHref = replaceHref;
  return middleware;
};
