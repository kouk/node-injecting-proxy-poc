var fs = require('fs'),
    path = require('path'),
    nconf = require('nconf'),
    defaultConfigFile = __dirname + '/config.json';

nconf.argv()
     .env({
         separator: '__',
         match: /^LIVEPROXY/
     });

var localConfigFile = path.resolve( nconf.get( 'localconf' ) || 'config-local.json' );
if (fs.existsSync(localConfigFile)) {
    console.log("Reading local config from: " + localConfigFile);
    nconf = nconf.file('local', {file: localConfigFile});
}

if (!fs.existsSync(defaultConfigFile))
    throw "Couldn't find config file: " + defaultConfigFile;
nconf = nconf.file('default', {file: defaultConfigFile})
nconf = nconf.defaults({
    'inject': [],
    'replace': [],
    'port': 80,
    'secure':false,
    'ssl': false,
    'suffix': "livelocal:8000",
    'listen': "127.0.0.1",
    'hidden_headers': []
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
