var util = require('util'),
    EventEmitter = require('events');

var me = module.exports = exports = function(options) {
  EventEmitter.call(this);
  this.options = options;
};

util.inherits(me, EventEmitter);

me.prototype.make_target = function(proxy) {};

me.prototype._replace = function(parsed_url, options, proxydata) {
  this.emit('replace_href', parsed_url, options, proxydata);
};

me.prototype._replace_external = function(parsed_url, options, proxydata) {
  this.emit('replace_href_external', parsed_url, options, proxydata);
};

me.prototype.attach_events = function(proxydata) {};

me.prototype.middleware = function(req, res, next) {
  var proxy = res._proxy;
  this.attach_events(proxy);
  if (!proxy.target) this.make_target(proxy);
  next();
};
