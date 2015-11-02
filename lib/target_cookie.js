var S = require('string'),
    url = require('url'),
    utils = require('./utils'),
    urlsafe_base64 = require('urlsafe-base64'),
    _ = require('underscore'),
    me = module.exports = exports = {};

me.handle_href = function(r, options) {
  // 'this' should be bound to the proxy data object
  r.host = this.req.headers.host.split('.')[0];
  r.host += options.suffix;
};

me.middleware = function(conf) {
  var options = conf || {cookie_prefix: ''};
  return function(proxy) {
    if (!proxy.req.headers.host)
        return;
    // Get cookie key
    var domain = proxy.req.headers.host;
    var subdomain = domain.split('.')[0];
    var cookie_key = options.cookie_prefix + subdomain;
    _.each(proxy.req.cookies, function(v, k) {
      if (k.toLowerCase() != cookie_key.toLowerCase())
          return;
      var encoded_cookie = proxy.req.cookies[k];
      var decoded_cookie = JSON.parse(S(urlsafe_base64.decode(encoded_cookie)).s);
      if(!decoded_cookie.proxy_target)
          return;
      // Get proxy requirements
      var domain = decoded_cookie.proxy_target.domain;
      var proto = decoded_cookie.proxy_target.proto || 'http';
      var port = '';
      if(decoded_cookie.proxy_target.port) {
        port = ':' + decoded_cookie.proxy_target.port;
      }
      var final_domain = domain + port;
      if (/^[A-Za-z0-9:.-]+$/.test(final_domain)) {
        proxy.target = proto + '://' + final_domain;
        proxy.context = decoded_cookie.context;
        proxy.on('href', me.handle_href.bind(proxy));
      }
    });
  };
};
