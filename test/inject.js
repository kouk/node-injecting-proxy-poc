var proxy = require('../proxy'),
    base32 = require('base32'),
    conf = require('../config'),
    nock = require('nock'),
    _ = require('underscore'),
    request = require('supertest');

describe('app-inject', function(){
  var default_target = 'target.doesn.t.exist.com:1234',
      mkbackend = function(statusCode, body, headers, path, target){
          t = 'http://' + (target || default_target);
          h = _.extend({'Content-Type': 'text/html'}, headers || {});
          return nock(t).defaultReplyHeaders(h).get(path || "/")
              .reply(statusCode || 200, body || "");
      };
  afterEach(function() {
      conf.set('inject', []);
  });
  it('should inject a simple string', function(done){
    conf.set('inject', [{
        'select': 'head',
        'payload': _.template('<div>FOOBAR</div>')
    }]);
    var server = proxy(conf),
        body = "<html><head><title>yo</title></head><body>man</body></html>",
        backend = mkbackend(200, body);
    server.listen(0, function(){
      request(server)
      .get('/')
      .set('Host', base32.encode(default_target) + '-http' + conf.get('suffix'))
      .expect(200, function(req, res) {
          res.text.should.equal(body.replace('</head>', '<div>FOOBAR</div></head>'));
          done();
      });
    });
  });
  it('should inject a simple string on a redirect', function(done){
    conf.set('inject', [{
        'select': 'head',
        'handle_redirect': true,
        'payload': _.template('<div>FOOBAR</div>')
    }]);
    var server = proxy(conf),
        body = "<html><head><title>yo</title></head><body>man</body></html>",
        backend = mkbackend(301, body, {Location: '/foobar'});
    server.listen(0, function(){
      request(server)
      .get('/')
      .set('Host', base32.encode(default_target) + '-http' + conf.get('suffix'))
      .expect(200, function(req, res) {
          res.text.should.equal(body.replace('</head>', '<div>FOOBAR</div></head>'));
          done();
      });
    });
  });
});

