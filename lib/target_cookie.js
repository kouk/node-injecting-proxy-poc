var S = require('string'),
    url = require('url'),
    utils = require('./utils'),
    urlsafe_base64 = require('urlsafe-base64');
module.exports = exports = function(conf) {
  var replaceHref = function(href, res, options) {
    var options = options || {secure: false, suffix: ''},
        r = url.parse(href, false, true),
        proto = options.secure ? 'https' : 'http',
        target_proto = r.protocol;
    if (!r.host) return href;
    if (!target_proto)
        target_proto = url.parse(res._proxy_req._proxy_target).protocol;
    r.host = res._proxy_req.headers.host.split('.')[0];
    r.host += options.suffix;
    if (options.deactivate_external &&
        !res._proxy_req.headers.host.startsWith(r.host))
        return "javascript:void;"

    r.protocol = proto;
    return r.format();
  }
  var middleware = function(req, res, next) {
    // Get cookie key
    var domain = req.headers.host;
    var subdomain = domain.split('.')[0];
    var cookie_key = conf.cookie_prefix + subdomain;
    var encoded_cookie = req.cookies[cookie_key];
    var decoded_cookie = JSON.parse(S(urlsafe_base64.decode(encoded_cookie)).s);
    if(decoded_cookie.proxy_target) {
      // Get proxy requirements
      var domain = decoded_cookie.proxy_target.domain;
      var proto = decoded_cookie.proxy_target.proto;
      var port = '';
      if(decoded_cookie.proxy_target.port) {
        port = ':' + decoded_cookie.proxy_target.port;
      }
      var final_domain = domain + port;
      if (/^[A-Za-z0-9:.-]+$/.test(final_domain)) {
          utils.set_proxy_target(req, proto + '://' + final_domain);
          // TODO: Create new replaceHref
          utils.set_href_replacer(req, replaceHref);
          utils.set_sidebar_mode(req, sidebar_mode);
          utils.set_auth_token(req, auth_token);
          utils.set_api_key(req, api_key);
      }
    }
    next();
  };
  return middleware;
};
