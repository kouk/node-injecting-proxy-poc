var target_base32 = require('../lib/target_base32'),
    connect = require('connect'),
    should = require('should'),
    base32 = require('base32'),
    request = require('supertest');
describe('target_base32.create', function(){
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
            console.log(req._proxy_target);
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
