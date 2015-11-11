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
  r.host = proxydata.request_id;
  r.host += options.proto_separator + r.protocol;
  r.host += options.suffix;
  r.protocol = options.secure ? 'https' : 'http';
};


me.prototype.find_cookie = function(cookies, request_id) {
  if (!request_id) return;
  var cookie_key = this.options.cookie_prefix + request_id;
  cookie_key = cookie_key.toLowerCase();
  cookie_key = _.findKey(cookies, function(v, k) {
    return (k.toLowerCase() == cookie_key);
  });
  if (!cookie_key) return;
  return cookie_key;
};


me.prototype.decode_cookie = function(value) {
  decoded = urlsafe_base64.decode(value).toString();
  return JSON.parse(decoded);
};


me.prototype.make_target = function(proxydata) {
  var decoded_cookie, req_id = proxydata.request_id, cookies = proxydata.req.cookies;
  try {
    cookie_key = this.find_cookie(cookies, req_id);
    if (cookie_key !== undefined) {
      decoded_cookie = this.decode_cookie(cookies[cookie_key]);
      delete cookies[cookie_key];
    }
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
    proxydata.on('href', this.handle_href);
    proxydata.on('redirect', function(r, proxyres, options, proxydata) {
       if (proxydata.redirect_id) return;
       var newcookie = _.clone(decoded_cookie),
           hdrs = proxyres.headers,
           rescookies = hdrs['set-cookie'] || [],
           newreqid = proxydata.request_id + "R" + _.sample(_.range(10), 5).join("");
       newcookie.proxy_target = _.clone(decoded_cookie.proxy_target);
       newcookie.proxy_target.domain = r.host;
       newcookie = urlsafe_base64.encode(new Buffer(JSON.stringify(newcookie)));
       if (hdrs['set-cookie'] === undefined)
           hdrs['set-cookie'] = [];
       hdrs['set-cookie'].push("txlivesettings_" + newreqid + "=" + newcookie);
       proxydata.redirect_id = newreqid;
    });
  }
};
