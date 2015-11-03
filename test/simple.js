var proxy = require('../proxy'),
    base32 = require('base32'),
    conf = require('../config'),
    nock = require('nock'),
    _ = require('underscore'),
    request = require('supertest');

describe('app.listen()', function(){
  beforeEach(function() {
      conf.set('timeout', 0);
  });
  it('should respond to a simple request on a hostname', function(done){
    var target = 'target.doesn.t.exist.com',
        server = proxy(conf),
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
        server = proxy(conf),
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
    conf.set('timeout', 100);
    conf.set('templates', {error_page: _.template('foo')});
    var target = 'target.doesn.t.exist.com:1234',
        server = proxy(conf),
        couchdb = nock('http://' + target)
           .get('/')
           .socketDelay(200) // 2 seconds
           .reply(200, "");
    server.listen(0, function(){
      request(server)
      .get('/')
      .set('Host', base32.encode(target) + '-http' + conf.get('suffix'))
      .expect(502, 'foo', done);
    });
  });
});
