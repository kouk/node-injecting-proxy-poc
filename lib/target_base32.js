var S = require('string'),
    url = require('url'),
    util = require('util'),
    base32 = require('base32'),
    _ = require('underscore'),
    target = require('./target'),
    me = module.exports = exports = function(options) {
      target.call(this, options);
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

me.prototype.attach_events = function(proxydata) {
  proxydata.on('href_external', this.handle_href);
};

me.prototype.make_target = function(proxydata) {
  var host = proxydata.request_id;
  if (!host) return;
  var original = base32.decode(host);
  console.log("decoded host from base32 host header: " + original);
  if (/^[A-Za-z0-9:.-]+$/.test(original)) {
    proxydata.target = proxydata.request_proto + '://' + original;
    proxydata.on('href', this.handle_href);
  }
};
