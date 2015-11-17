var proxy = require('../proxy'),
    base32 = require('base32'),
    mkconf = require('../config'),
    nock = require('nock'),
    _ = require('underscore'),
    request = require('supertest');

describe('app.listen()', function(){
  it('should respond to a simple request on a hostname', function(done){
    var target = 'target.doesn.t.exist.com',
        conf = mkconf(), server = proxy(conf),
        couchdb = nock('http://' + target)
           .get('/')
           .reply(200, "");
    server.listen(0, function(){
      request(server)
      .get('/')
      .set('Host', base32.encode(target) + '-http' + conf.get('suffix'))
      .expect(200, done);
    });
  });
  it('should respond to a simple request on a hostname with a port', function(done){
    var target = 'target.doesn.t.exist.com:1234',
        conf = mkconf(), server = proxy(conf),
        couchdb = nock('http://' + target)
           .get('/')
           .reply(200, "");
    server.listen(0, function(){
      request(server)
      .get('/')
      .set('Host', base32.encode(target) + '-http' + conf.get('suffix'))
      .expect(200, done);
    });
  });
  it('should timeout a slow response', function(done){
    var target = 'target.doesn.t.exist.com:1234',
        conf = mkconf({
            timeout: 100,
            mask_redirect: false,
            context: {
              error_page_url: "http://foo/bar"
            }
        }),
        server = proxy(conf),
        couchdb = nock('http://' + target)
           .get('/')
           .socketDelay(200) // 2 seconds
           .reply(200, "");
    server.listen(0, function(){
      request(server)
      .get('/')
      .set('Host', base32.encode(target) + '-http' + conf.get('suffix'))
      .expect(301, '', done);
    });
  });
});
