var S = require('string'),
    url = require('url'),
    utils = require('./utils');
module.exports = exports = function(conf) {
  var middleware = function(req, res, next) {
    next();
  };
  return middleware;
};
