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
    _context: {},
    _target: null,
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
    get request_id() {
        var host = this.req.headers.host,
            sep = this.opts.proto_separator;
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
    replace_href: function(href, options) {
        var that = this;
            options = _.extend({}, that.opts, options);
            r = url.parse(href, false, true);
        that.emit('href', r, options);
        if (!r.host) return href;
        if (options.deactivate_external &&
            !that.req.headers.host.startsWith(r.host))
            return "javascript:void;";  // jshint ignore:line
        r.protocol = options.secure ? 'https' : 'http';
        return r.format();
    }
});

module.exports = exports = {
    ProxyData: pdata
};
