var me = module.exports = exports = function(err, req, res, conf) {
  res.writeHead(
    301,
    {
      'Location': conf.get('redirects').error_page_url + '?id=' + res._proxy.request_id,
      'Expires': (new Date()).toGMTString()
    }
  );
};
