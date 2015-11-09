var target_cookie = require('../lib/target_cookie'),
    connect = require('connect'),
    should = require('should'),
    base32 = require('base32'),
    nodemock = require('nodemock'),
    request = require('supertest'),
    urlsafe_base64 = require('urlsafe-base64');
describe('target_cookie', function(){
  describe('middleware', function(){
    var target, req;
    beforeEach(function() {
        req = {cookies: {}, headers: {}};
        target = new target_cookie({cookie_prefix: 'lalacookie'});
    });
    it('should do nothing without a host', function(){
        var proxy = nodemock.mock('on').fail();
        proxy.req = req;
        target.make_target(proxy);
        should.not.exist(proxy.target);
    });
    it('should not add a host when cookie isn\'t present', function(){
        var proxy = nodemock.mock('on').fail();
        proxy.req = req;
        target.make_target(proxy);
        should.not.exist(proxy.target);
    });
    it('should do nothing if host doesn\'t match a cookie', function(){
        var proxy = nodemock.mock('on').fail();
        proxy.req = req;
        proxy.req.headers.host = 'XYZ-http';
        proxy.req.cookies.lalacookieWAT = 'value';
        target.make_target(proxy);
        should.not.exist(proxy.target);
    });
    it('should add the target if a cookie matches the host', function(){
        var cookie = Buffer(JSON.stringify({
            proxy_target: {
                domain: 'host'
            }
        }));
        var proxy = nodemock.mock('on').takesAll().times(2); // .takes('replace_href', function() {});
        proxy.req = req;
        proxy.req.cookies.lalacookieXYZ = urlsafe_base64.encode(cookie);
        proxy.request_id = 'XYZ';
        proxy.request_proto = 'http';
        target.make_target(proxy);
        should.exist(proxy.target);
        proxy.request_proto.should.equal('http');
        proxy.target.should.equal('http://host');
        //proxy.assertThrows();
    });
    it('should add the target if a cookie matches the host (https)', function(){
        var cookie = Buffer(JSON.stringify({
            proxy_target: {
                domain: 'host'
            }
        }));
        var proxy = nodemock.mock('on').takesAll().times(2); //.takes('replace_href', function() {});
        proxy.req = req;
        proxy.req.cookies.lalacookieXYZ = urlsafe_base64.encode(cookie);
        proxy.request_id = 'XYZ';
        proxy.request_proto = 'https';
        target.make_target(proxy);
        should.exist(proxy.target);
        proxy.request_proto.should.equal('https');
        proxy.target.should.equal('https://host');
        //proxy.assertThrows();
    });
  });
});
