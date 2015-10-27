var target_base32 = require('../lib/target_base32'),
    connect = require('connect'),
    should = require('should'),
    base32 = require('base32'),
    nodemock = require('nodemock'),
    request = require('supertest');
describe('target_base32', function(){
  describe('middleware', function(){
    it('should do nothing without a host', function(done){
        var app = connect();
        app.use(target_base32());
        app.use(function(req, res){
            should.not.exist(req._proxy_target);
            res.end();
        });
        request(app)
        .get('/')
        .expect(200)
        .end(function(e, r) { done(e);  });
    });
    it('should do nothing if host header is not in the expected format', function(done){
        var app = connect();
        app.use(target_base32());
        app.use(function(req, res){
            should.not.exist(req._proxy_target);
            res.end();
        });
        request(app)
        .get('/')
        .set('Host', 'lala')
        .expect(200)
        .end(function(e, r) { done(e);  });
    });
    it('should decode a properly formatted host header', function(done){
        var app = connect();
        app.use(target_base32({
            suffix: '.bar'
        }));
        app.use(function(req, res){
            should.exist(req._proxy_target);
            req._proxy_target.should.equal('http://foo');
            res.end();
        });
        request(app)
        .get('/')
        .set('Host', base32.encode('foo') + '.http.bar')
        .expect(200)
        .end(function(e, r) { done(e);  });
    });
  });
  describe('replaceHref', function(){
    var replaceHref;
    beforeEach(function() {
        replaceHref = target_base32().replaceHref;
    });
    it('should do nothing without a host', function(){
      var url = '/foobar';
      url.should.equal(replaceHref(url));
    });
    it('should replace the href', function(){
      var url = 'http://google.com/foobar',
          expected = 'http://cxqpytvccmq66vvd.http/foobar';
      expected.should.equal(replaceHref(url));
    });
    it('should automatically guess the protocol', function(){
      var url = '//google.com',
          req = nodemock.named('req'),
          res = nodemock.named('res');
      req._proxy_target = 'http://lala';
      res._proxy_req = req;
      replaceHref(url, res).should.endWith('http');
      res._proxy_target='https://lala';
      replaceHref(url, res).should.endWith('https');
    });
    it('should deactivate external links', function(){
      var url = 'http://google.com',
          req = nodemock.named('req'),
          res = nodemock.named('res');
      req.headers = {host: 'foobar'}
      res._proxy_req = req;
      replaceHref(url, res, {deactivate_external: true}).should.equal("javascript:void;")
    });
  });
});
