var util = require('util'),
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
}

util.inherits(pdata, EventEmitter);

_.extend(pdata.prototype, {
    _merge_context: function(context){
        context = context || {};
        return _.extend({}, context, this.opts.context);
    },
    set context(context) {
      this._context = this._merge_context(context);
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
    replace_href: function(href, options) {
        var that = this;
            options = _.extend({}, that.opts, options);
            r = url.parse(href, false, true);
        that.emit('href', r, options);
        if (!r.host) return href;
        if (options.deactivate_external &&
            !that.req.headers.host.startsWith(r.host))
            return "javascript:void;"
        r.protocol = options.secure ? 'https' : 'http';
        return r.format();
    }
});

module.exports = exports = {
    ProxyData: pdata
}
