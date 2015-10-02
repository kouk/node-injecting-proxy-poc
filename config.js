var fs = require('fs'),
    path = require('path'),
    nconf = require('nconf');

nconf.argv()
     .env({
         separator: '__',
         match: /^LIVEPROXY/
     });
var configFile = path.resolve( nconf.get( 'conf' ) || 'config.json' );
if (fs.existsSync(configFile)) {
    console.log("Reading config from: " + configFile);
    nconf = nconf.file({file: configFile});
}
nconf = nconf.defaults({
    'inject': [],
    'replace': [],
    'port': 80,
    'secure':false,
    'suffix': "livelocal"
});

module.exports = exports = nconf