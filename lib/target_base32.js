var S = require('string'),
    url = require('url'),
    util = require('util'),
    base32 = require('base32'),
    _ = require('underscore'),
    target = require('./target'),
    me = module.exports = exports = function(options) {
      target.call(this, options);
      this.on('replace_href_external', this.handle_href);
    };

util.inherits(me, target);

me.prototype.handle_href = function(r, options) {
  // replace the host with the base32 encoded version
  if (!r.host || !r.protocol) return;
  options = _.extend({}, this.options, options);
  r.host = base32.encode(r.host);
  r.host += options.proto_separator + S(r.protocol).chompRight(':');
  r.host += options.suffix || '';
  r.protocol = options.secure ? 'https' : 'http';
};

me.prototype.make_target = function(proxydata) {
  var host = proxydata.request_id;
  if (!host) return;
  var original = base32.decode(host);
  console.log("decoded host from base32 host header: " + original);
  if (/^[A-Za-z0-9:.-]+$/.test(original)) {
    proxydata.target = proxydata.request_proto + '://' + original;
    if (this.listeners('replace_href').indexOf(this.handle_href) == -1)
      this.on('replace_href', this.handle_href);
  }
};
