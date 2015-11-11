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
      var newurl = pdata.handle_redirect({headers: {}});
      should.not.exist(newurl);
      emitspy.called.should.be.false();
    });
    it('should emit the redirect event', function(){
      var url = 'http://google.com', returl = 'bar',
          req = nodemock.named('req'),
          res = nodemock.named('res');
      var pdata = new utils.ProxyData(req, res, {}),
          headers = {location: 'foo'},
          emitspy = sinon.spy(pdata, 'emit'),
          rstub = sinon.stub(pdata, 'replace_href').returns(returl);
      var newurl = pdata.handle_redirect({headers: headers});
      newurl.should.equal(returl);
      headers.location.should.equal(returl);
      emitspy.called.should.be.true();
      rstub.calledOnce.should.be.true();
      rstub.lastCall.args[0].should.equal('foo');
      should.exist(rstub.lastCall.args[1].deactivate_external);
      rstub.lastCall.args[1].deactivate_external.should.be.false();
      should.exist(headers.location);
    });
    it('should reset the status code if configured', function(){
      var url = 'http://google.com', returl='bar',
          req = nodemock.named('req'),
          res = nodemock.named('res');
      var pdata = new utils.ProxyData(req, res, {mask_redirect: true}),
          headers = {location: 'foo'},
          proxyres = {headers: headers},
          emitspy = sinon.spy(pdata, 'emit'),
          rstub = sinon.stub(pdata, 'replace_href').returns(returl);
      var newurl = pdata.handle_redirect(proxyres);
      newurl.should.equal(returl);
      emitspy.called.should.be.true();
      rstub.calledOnce.should.be.true();
      proxyres.headers.location.should.equal('foo');
      should.exist(proxyres.statusCode);
      proxyres.statusCode.should.equal(200);
    });
  });
});
