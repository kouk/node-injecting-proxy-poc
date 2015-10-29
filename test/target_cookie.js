var target_cookie = require('../lib/target_cookie'),
    connect = require('connect'),
    should = require('should'),
    base32 = require('base32'),
    nodemock = require('nodemock'),
    request = require('supertest');
describe('target_cookie', function(){
  describe('middleware', function(){
    it('should not add a host when cookie isn\'t present', function(done){
        var app = connect();
        app.use(target_cookie());
        app.use(function(req, res){
            should.not.exist(req._proxy_target);
            res.end();
        });
        request(app)
        .get('/')
        .expect(200)
        .end(function(e, r) { done(e);  });
    });
  });
});
