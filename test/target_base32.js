var target_base32 = require('../lib/target_base32'),
    connect = require('connect'),
    should = require('should'),
    url = require('url'),
    base32 = require('base32'),
    nodemock = require('nodemock'),
    request = require('supertest');
describe('target_base32', function(){
  describe('middleware', function(){
    var target, req;
    beforeEach(function() {
        req = {headers: {}};
        target = new target_base32({suffix: '.bar'});
    });
    it('should do nothing without a host', function(){
        var proxy = nodemock.mock('on').fail();
        proxy.req = req;
        target.make_target(proxy);
        should.not.exist(proxy.target);
    });
    it('should do nothing if host header is not in the expected format', function(){
        var proxy = nodemock.mock('on').fail();
        proxy.req = req;
        proxy.req.headers.host = 'lala';
        target.make_target(proxy);
        should.not.exist(proxy.target);
    });
    it('should decode a properly formatted host header', function(){
        var proxy = nodemock.mock('on').takes('href', function() {});
        proxy.req = req;
        proxy.request_id = base32.encode('foo');
        proxy.request_proto = 'http';
        target.make_target(proxy);
        should.exist(proxy.target);
        proxy.target.should.equal('http://foo');
        //proxy.assertThrows();
    });
  });
  describe('replaceHref', function(){
    var target;
    beforeEach(function() {
        target = new target_base32({proto_separator: '_', suffix: '.bar'});
    });
    it('should do nothing without a host', function(){
      var url = {};
      target.handle_href(url);
      should.not.exist(url.host);
    });
    it('should replace the href', function(){
      var url = {protocol: 'http', host: 'google.com'};
      target.handle_href(url);
      url.host.should.equal('cxqpytvccmq66vvd_http.bar');
      url = {protocol: 'https', host: 'google.com'};
      target.handle_href(url);
      url.host.should.equal('cxqpytvccmq66vvd_https.bar');
    });
  });
});
