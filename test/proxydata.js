var connect = require('connect'),
    should = require('should'),
    url = require('url'),
    base32 = require('base32'),
    nodemock = require('nodemock'),
    sinon = require('sinon'),
    events = require('events'),
    utils = require('../lib/utils'),
    sandbox = require('sandboxed-module'),
    request = require('supertest');
describe('util.ProxyData', function(){
  describe('replace_href', function(){
    it('should deactivate external links', function(){
      var url = 'http://google.com',
          req = nodemock.named('req'),
          res = nodemock.named('res');
      var pdata = new utils.ProxyData(req, res, {});
      req.headers = {host: 'foobar'};
      pdata.replace_href(url, {deactivate_external: true}).should.equal("javascript:void;");  // jshint ignore:line
    });
  });
  describe('handle_redirect', function(){
    it('should do nothing if proxy res is 200', function(){
      var url = 'http://google.com',
          req = nodemock.named('req'),
          res = nodemock.named('res');
      var pdata = new utils.ProxyData(req, res, {}),
          emitspy = sinon.spy(pdata, 'emit');
      pdata.handle_redirect({headers: {}});
      emitspy.called.should.be.false();
    });
    it('should emit the redirect event', function(){
      var url = 'http://google.com',
          req = nodemock.named('req'),
          res = nodemock.named('res');
      var pdata = new utils.ProxyData(req, res, {handle_redirect: true}),
          headers = {location: 'foo'},
          emitspy = sinon.spy(pdata, 'emit'),
          rstub = sinon.stub(pdata, 'replace_href').returns('bar');
      pdata.handle_redirect({headers: headers});
      emitspy.called.should.be.true();
      rstub.calledOnce.should.be.true();
      rstub.lastCall.args[0].should.equal('foo');
      should.exist(rstub.lastCall.args[1].deactivate_external);
      rstub.lastCall.args[1].deactivate_external.should.be.false();
      should.exist(headers.location);
      headers.location.should.equal('bar');
    });
    it('should reset the status code if configured', function(){
      var url = 'http://google.com',
          req = nodemock.named('req'),
          res = nodemock.named('res');
      var pdata = new utils.ProxyData(req, res, {handle_redirect: false}),
          headers = {location: 'foo'},
          proxyres = {headers: headers},
          emitspy = sinon.spy(pdata, 'emit'),
          rstub = sinon.stub(pdata, 'replace_href').returns('bar');
      pdata.handle_redirect(proxyres);
      emitspy.called.should.be.true();
      rstub.calledOnce.should.be.true();
      proxyres.headers.location.should.equal('foo');
      should.exist(proxyres.statusCode);
      proxyres.statusCode.should.equal(200);

    });
  });
});
