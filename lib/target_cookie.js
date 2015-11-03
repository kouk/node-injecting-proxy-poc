var S = require('string'),
    url = require('url'),
    util = require('util'),
    target = require('./target'),
    urlsafe_base64 = require('urlsafe-base64'),
    _ = require('underscore'),
    me = module.exports = exports = function(options){
      target.call(this, options);
    };

util.inherits(me, target);

me.prototype.handle_href = function(r, options, proxydata) {
  if (!r.host || !r.protocol) return;
  options = _.extend({}, this.options, options);
  r.host = proxydata.req.headers.host.split('.')[0];
  r.host += options.protocol_separator + r.protocol;
  r.host += options.suffix;
  r.protocol = options.secure ? 'https' : 'http';
};


me.prototype.find_cookie = function(cookies, request_id) {
  if (!request_id) return;
  var cookie_key = this.options.cookie_prefix + request_id;
  cookie_key = cookie_key.toLowerCase();
  key = _.findKey(cookies, function(v, k) {
    return (k.toLowerCase() == cookie_key);
  });
  if (!key) return;
  decoded = urlsafe_base64.decode(cookies[key]).toString();
  return JSON.parse(decoded);
};


me.prototype.make_target = function(proxydata) {
  var req_id = proxydata.request_id, cookies = proxydata.req.cookies;
  try {
    decoded_cookie = this.find_cookie(cookies, req_id);
  } catch (e) {
    console.log("Error finding cookie");
    console.log(e);
  }
  if (!decoded_cookie || !decoded_cookie.proxy_target)
    return;
  var domain = decoded_cookie.proxy_target.domain,
      proto = proxydata.request_proto;
  if(decoded_cookie.proxy_target.port)
    domain += ':' + decoded_cookie.proxy_target.port;
  if (/^[A-Za-z0-9:.-]+$/.test(domain)) {
    proxydata.target = proto + '://' + domain;
    proxydata.context = decoded_cookie.context;
    if (this.listeners('replace_href').indexOf(this.handle_href) == -1)
      this.on('replace_href', this.handle_href);
  }
};
