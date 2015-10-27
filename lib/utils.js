module.exports = exports = {
    replaceHref: function (href, res, options) {
        var req = res._proxy_req;
        if (req && req._proxy_href_replace)
            return req._proxy_href_replace(href, res, options);
        return href;
    },
    href_replacer: function(req) {
        return req._proxy_href_replace;
    },
    set_href_replacer: function(req, replacer) {
        req['_proxy_href_replace'] = replacer;
    },
    set_proxy_target: function(req, target) {
        req['_proxy_target'] = target;
    },
    get_proxy_target: function(req) {
        return req._proxy_target;
    }
}
