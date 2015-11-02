var proxy = require('../proxy'),
    base32 = require('base32'),
    conf = require('../config'),
    nock = require('nock'),
    _ = require('underscore'),
    request = require('supertest');

describe('app-inject', function(){
  afterEach(function() {
      conf.set('inject', []);
  });
  it('should inject a simple string', function(done){
    conf.set('inject', [{
        'select': 'head',
        'payload': _.template('<div>FOOBAR</div>')
    }]);
    var target = 'target.doesn.t.exist.com:1234',
        server = proxy(conf),
        couchdb = nock('http://' + target)
           .defaultReplyHeaders({
              'Content-Type': 'text/html'
           })
           .get('/')
           .reply(200, "<html><head><title>yo</title></head><body>man</body></html>");
    server.listen(0, function(){
      request(server)
      .get('/')
      .set('Host', base32.encode(target) + '-http' + conf.get('suffix'))
      .expect(200, function(req, res) {
          res.text.should.equal('<html><head><title>yo</title><div>FOOBAR</div></head><body>man</body></html>');
          done();
      });
    });
  });
});

