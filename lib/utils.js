var util = require('util'),
    S = require('string'),
    connect = require('connect'),
    EventEmitter = require('events'),
    _ = require('underscore'),
    url = require('url'),
    http = require('http');

var pdata = function (req, res, opts) {
    EventEmitter.call(this);
    this.res = res;
    this.req = req;
    this.opts = opts;
    this._context = {};
    this._target = null;
    this.context = this.opts.context;
};

var update = function (target) {
    var sources = [].slice.call(arguments, 1);
    sources.forEach(function (source) {
        Object.getOwnPropertyNames(source).forEach(function(propName) {
            Object.defineProperty(target, propName,
                Object.getOwnPropertyDescriptor(source, propName));
        });
    });
    return target;
};

util.inherits(pdata, EventEmitter);

update(pdata.prototype, {
    set context(context) {
      _.extend(this._context, context, this.opts.context);
    },
    get context() {
      return this._context;
    },
    set target(target) {
      this._target = target;
    },
    get target() {
      return this._target;
    },
    set redirect_id(redirid) {
        this._redirect_id = redirid;
    },
    get redirect_id() {
      return this._redirect_id;
    },
    get request_id() {
        var host = this.req.headers.host,
            sep = this.opts.proto_separator;
        if (this.redirect_id) return this.redirect_id;
        if (!this._req_id && host) {
            host = S(host).chompRight(this.opts.suffix);
            this._req_proto = host.endsWith('https') ? 'https': 'http';
            this._req_id = host.chompRight(sep + this._req_proto).s;
        }
        return this._req_id;
    },
    get request_proto() {
        if (!this.request_id)
            return;
        return this._req_proto;
    },
    normalize_url: function(r) {
        // in case href starts with //
        if (!r.protocol && this.target)
            r.protocol = url.parse(this.target).protocol;
        r.protocol = r.protocol.split(':')[0];
    },
    replace_href: function(href, options) {
        var that = this;
            options = _.extend({}, that.opts, options);
            r = url.parse(href, false, true);
        if (!r.host) return href;
        that.normalize_url(r);
        // if target and href domain match
        if (that.target && that.target.split('//')[1].startsWith(r.host)) {
            that.emit('href', r, options, that);
        } else {
            if (options.deactivate_external)
                return "javascript:void;";  // jshint ignore:line
            that.emit('href_external', r, options, that);
        }
        return r.format();
    },
    on: function(event_name, callback) {
        if (this.listeners(event_name).indexOf(callback) == -1)
            this.addListener(event_name, callback);
    },
    handle_redirect: function(proxyres) {
        var rurl = proxyres.headers.location;
        if (rurl === undefined) return;
        var origloc = url.parse(rurl);
        if (!origloc.host) {
            origloc = url.parse(this.target);
            origloc.path = rurl;
        }
        this.emit('redirect', origloc, proxyres, this.opts, this);
        rurl = proxyres.headers.location;
        if (this.opts.mask_redirect === true) {
            delete proxyres.headers.location;
            proxyres.statusCode = 200;
        }
        return rurl;
    },
    _outgoing_cookie_strip_re: new RegExp('; (Expires|Max-Age|Domain)[^;]*'),
    mangle_outgoing_cookie: function(c) {
        if (this.opts.secure)
            c = c.replace('; Secure', '');
        c = c.replace(this._outgoing_cookie_strip_re, '');
        if (!c.endsWith(';')) c+= ';';
        c += 'Domain=' + this.opts.suffix + '; Path=/;';
        return c;
    }
});

module.exports = exports = {
    ProxyData: pdata
};
