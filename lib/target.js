var util = require('util'),
    EventEmitter = require('events');

var me = module.exports = exports = function(options) {
  EventEmitter.call(this);
  this.options = options;
};

util.inherits(me, EventEmitter);

me.prototype.make_target = function(proxy) {};

me.prototype.attach_events = function(proxydata) {};

me.prototype.middleware = function(req, res, next) {
  var proxy = res._proxy;
  this.attach_events(proxy);
  if (!proxy.target) this.make_target(proxy);
  next();
};
