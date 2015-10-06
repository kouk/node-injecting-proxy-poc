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
    'ssl': false,
    'suffix': "livelocal:8000",
    'listen': "127.0.0.1"
});

nconf.get('inject').forEach(function(i) {
    if (i.file) {
        var p = path.resolve(i.file);
        if (!fs.existsSync(p))
            throw "Can't find file: " + i.file;
        console.log("reading payload file "+ p);
        i['payload'] = fs.readFile(p, function(e, data) {
            if (e)
                throw e;
            i['payload'] = data;
        });
        delete i['file']
    }
});

module.exports = exports = nconf
