var S = require('string'),
    url = require('url'),
    utils = require('./utils'),
    base32 = require('base32');
    me = module.exports = exports = {};

me.handle_href = function (r, options) {
  // replace the host with the base32 encoded version
  if (!r.host) return;
  var target_proto = r.protocol,
      options = options || {};
  if (!target_proto) {
      if (!this.target) return;
      target_proto = url.parse(this.target).protocol;
  }
  r.host = base32.encode(r.host);
  r.host += "." + S(target_proto).chompRight(':');
  r.host += options.suffix || '';
};

me.middleware = function(conf) {
  var options = conf || {suffix: ''};
  return function(proxy) {
    if (!proxy.req.headers.host)
      return;
    var host = proxy.req.headers.host,
        protohost = S(host).chompRight(options.suffix),
        proto = protohost.endsWith('.https') ? 'https' : 'http';
        host = protohost.chompRight('.' + proto).s;
    if (protohost == host) {
      console.log("Invalid proto and host (suffix: " + options.suffix + ")");
      return;
    }
    var original = base32.decode(host);
    console.log("decoded host from base32 host header: " + original);
    if (/^[A-Za-z0-9:.-]+$/.test(original)) {
      proxy.target = proto + '://' + original;
      proxy.on('href', me.handle_href.bind(proxy));
    }
  };
};
