var http = require('http'),
    https = require('https'),
    fs = require('fs'),
    utils = require('./proxy_util'),
    conf = require('./config'),
    proxy = require('./proxy'),
    port = conf.get('port'),
    listen = conf.get('listen'),
    createServer = function() {
        if (conf.get('ssl')) {
            return https.createServer({
              key: fs.readFileSync(__dirname + '/key.pem'),
              cert: fs.readFileSync(__dirname + '/certificate.pem'),
              ca: fs.readFileSync(__dirname + '/certificate.pem'),
              requestCert: false,
              rejectUnauthorized: false
            }, require('./proxy'));
        } else {
            return http.createServer(require('./proxy'));
        }
    };

console.log("Listening on: " + listen + ":" + port);
createServer().listen(port, listen);
