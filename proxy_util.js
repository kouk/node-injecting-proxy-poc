var url = require('url'),
    S = require('string'),
    base32 = require('base32');

exports.replaceHref = function (href, res, options) {
    var options = options || {secure: false, suffix: ''},
        r = url.parse(href, false, true),
        proto = options.secure ? 'https' : 'http',
        target_proto = r.protocol;
    if (!r.host) return href;
    if (!target_proto)
        target_proto = url.parse(res._proxy_target).protocol;
    r.host = base32.encode(r.host);
    r.host += "." + S(target_proto).chompRight(':');
    r.host += options.suffix;

    if (options.deactivate_external &&
        !res._proxy_req.headers.host.startsWith(r.host))
        return "javascript:void;"

    r.protocol = proto;
    return r.format();
}
exports.createTarget = function (host, options) {
    var options = options || {suffix: ''},
        protohost = S(host).chompRight(options.suffix),
        proto = protohost.endsWith('.https') ? 'https' : 'http';
        host = protohost.chompRight('.' + proto).s;
    console.log(proto + " host requested: " + host)
    if (protohost == host) {
        console.log("Invalid proto and host (suffix: " + options.suffix + ")");
        return null;
    }
    var original = base32.decode(host);
    console.log("decoded host: " + original);
    if (/^[A-Za-z0-9:.-]+$/.test(original))
        return proto + '://' + original;
    return "https://invalid" + options.suffix;
}
