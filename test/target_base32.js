var target_base32 = require('../lib/target_base32'),
    connect = require('connect'),
    should = require('should'),
    url = require('url'),
    base32 = require('base32'),
    nodemock = require('nodemock'),
    request = require('supertest');
describe('target_base32', function(){
  describe('middleware', function(){
    var targetf, req;
    beforeEach(function() {
        req = {headers: {}};
        targetf = target_base32.middleware({suffix: '.bar'});
    });
    it('should do nothing without a host', function(){
        var proxy = nodemock.mock('on').fail();
        proxy.req = req;
        targetf(proxy);
        should.not.exist(proxy.target);
    });
    it('should do nothing if host header is not in the expected format', function(){
        var proxy = nodemock.mock('on').fail();
        proxy.req = req;
        proxy.req.headers.host = 'lala';
        targetf(proxy);
        should.not.exist(proxy.target);
    });
    it('should decode a properly formatted host header', function(){
        var proxy = nodemock.mock('on').takes('href', function() {});
        proxy.req = req;
        proxy.req.headers.host = base32.encode('foo') + '.http.bar';
        targetf(proxy);
        should.exist(proxy.target);
        proxy.target.should.equal('http://foo');
        proxy.assertThrows();
    });
  });
  describe('replaceHref', function(){
    it('should do nothing without a host', function(){
      var url = {};
      target_base32.handle_href(url)
      should.not.exist(url.host);
    });
    it('should replace the href', function(){
      var url = {protocol: 'http', host: 'google.com'};
      target_base32.handle_href(url);
      url.host.should.equal('cxqpytvccmq66vvd.http');
    });
    it('should automatically guess the protocol', function(){
      var url = {host: 'google.com'};
      target_base32.handle_href.call({target: 'http://lala'}, url);
      url.host.should.endWith('http');
      url.host = 'google.com';
      target_base32.handle_href.call({target: 'https://lala'}, url);
      url.host.should.endWith('https');
    });
  });
});
