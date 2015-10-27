var target_base32 = require('../lib/target_base32'),
    connect = require('connect'),
    should = require('should'),
    request = require('supertest');
describe('target_base32.create', function(){
    it('should do nothing without a host', function(done){
        var app = connect();
        app.use(target_base32.create);
        app.use(function(req, res){
            should.not.exist(req._proxy_target);
            res.end();
        });
        request(app)
        .get('/')
        .expect(200)
        .end(function(e, r) { done(e);  });
    })
});
