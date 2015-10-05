var url = require('url'),
    S = require('string'),
    base32 = require('base32'),
    conf = require('./config');

exports.replaceHref = function (href) {
    var r = url.parse(href, false, true),
        proto = conf.get('secure') ? 'https' : 'http';
    if (!r.host) return href;
    r.protocol = proto;
    r.host = base32.encode(r.host);
    r.host += "." + proto;
    r.host += conf.get('suffix');
    return r.format();
}
exports.createTarget = function (host) {
    var host = S(host).chompRight(conf.get('suffix')),
        proto = host.endsWith('.https') ? 'https' : 'http',
        original = base32.decode(host.chompRight('.' + proto).s);
    if (/^[A-Za-z0-9.-]+$/.test(original))
        return proto + '://' + original;
    return "https://invalid" + conf.get('suffix');
}
