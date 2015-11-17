var me = module.exports = exports = function(err, req, res) {
  var url = this.opts.context.error_page_url;
  if (!url) return false;
  res.writeHead(
    301,
    {
      'Location': url + '?id=' + this.request_id,
      'Expires': (new Date()).toGMTString()
    }
  );
  return true;
};
