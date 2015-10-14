var proxy = require('../proxy'),
    base32 = require('base32'),
    conf = require('../config'),
    nock = require('nock'),
    request = require('supertest');

describe('app.listen()', function(){
  it('should respond to a simple request on a hostname', function(done){
    var target = 'target.doesn.t.exist.com',
        server = proxy(conf),
        couchdb = nock('http://' + target)
           .get('/')
           .reply(200, "");
    server.listen(0, function(){
      request(server)
      .get('/')
      .set('Host', base32.encode(target) + '.http' + conf.get('suffix'))
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
      .set('Host', base32.encode(target) + '.http' + conf.get('suffix'))
      .expect(200, done);
    });
  });
});
