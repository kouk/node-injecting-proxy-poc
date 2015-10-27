var S = require('string'),
    base32 = require('base32');
module.exports = exports = function(conf) {
  return function(req, res, next) {
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
            if (/^[A-Za-z0-9:.-]+$/.test(original))
                req['_proxy_target'] = proto + '://' + original;
        }
    }
    next();
  };
};
