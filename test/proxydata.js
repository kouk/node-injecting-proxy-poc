var connect = require('connect'),
    should = require('should'),
    url = require('url'),
    base32 = require('base32'),
    nodemock = require('nodemock'),
    request = require('supertest'),
    utils = require('../lib/utils');
describe('util.ProxyData', function(){
  describe('replace_href', function(){
    it('should deactivate external links', function(){
      var url = 'http://google.com',
          req = nodemock.named('req'),
          res = nodemock.named('res');
      var pdata = new utils.ProxyData(req, res, {});
      req.headers = {host: 'foobar'}
      pdata.replace_href(url, {deactivate_external: true}).should.equal("javascript:void;");
    });
  });
});
