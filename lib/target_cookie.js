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
    var req_id = proxy.request_id;
    if (!req_id)
      return;
    // Get cookie key
    var cookie_key = options.cookie_prefix + req_id;
    _.each(proxy.req.cookies, function(v, k) {
      if (k.toLowerCase() != cookie_key.toLowerCase())
          return;
      var encoded_cookie = proxy.req.cookies[k];
      var decoded_cookie = JSON.parse(S(urlsafe_base64.decode(encoded_cookie)).s);
      if(!decoded_cookie.proxy_target)
          return;
      // Get proxy requirements
      var domain = decoded_cookie.proxy_target.domain;
      var port = '';
      if(decoded_cookie.proxy_target.port) {
        port = ':' + decoded_cookie.proxy_target.port;
      }
      var final_domain = domain + port;
      if (/^[A-Za-z0-9:.-]+$/.test(final_domain)) {
        proxy.target = proxy.request_proto + '://' + final_domain;
        proxy.context = decoded_cookie.context;
        proxy.on('href', me.handle_href.bind(proxy));
      }
    });
  };
};
