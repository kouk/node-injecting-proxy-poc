var url = require('url'),
    S = require('string'),
    conf = require('./config'),
    suffix = function() {
        return "." + conf.get('suffix') + ":" + conf.get('port');
    };

exports.proxySuffix = suffix;
exports.replaceHref = function (href) {
    var r = url.parse(href, false, true);
    if (!r.host) return href;
    r.host += (r.protocol == 'https:' ? '.https' : '.http') + suffix();
    r.protocol = conf.get('secure') ? 'https' : 'http';
    return r.format();
}
exports.createTarget = function (host) {
    console.log("ORIG HOST: " + host);
    console.log("SUFFIX: " + suffix());
    var host = S(host).chompRight(suffix()),
        proto = host.endsWith('.https') ? 'https' : 'http';
    console.log("HOST: " + host);
    console.log("PROTO: " + proto);
    return proto + '://' + host.chompRight('.' + proto).s;
}
