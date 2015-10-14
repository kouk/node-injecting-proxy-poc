var proxy_util = require('../proxy_util'),
    base32 = require('base32'),
    assert = require('assert'),
    nodemock  = require('nodemock');

describe('proxy_util.replaceHref()', function(){
  it('should do nothing without a host', function(){
    var url = '/foobar';
    assert.equal(url, proxy_util.replaceHref(url));
  });
  it('should replace the href', function(){
    var url = 'http://google.com/foobar',
        expected = 'http://cxqpytvccmq66vvd.http/foobar';
    assert.equal(expected, proxy_util.replaceHref(url));
  });
  it('should automatically guess the protocol', function(){
    var url = '//google.com',
        res = nodemock.named('res');
    res._proxy_target='http://lala';
    assert(proxy_util.replaceHref(url, res).endsWith('http'));
    res._proxy_target='https://lala';
    assert(proxy_util.replaceHref(url, res).endsWith('https'));
  });
  it('should deactivate external links', function(){
    var url = 'http://google.com',
        req = nodemock.named('req'),
        res = nodemock.named('res');
    req.headers = {host: 'foobar'}
    res.req = req;
    assert.equal("javascript:void;", proxy_util.replaceHref(url, res, {deactivate_external: true}))
  });
});
