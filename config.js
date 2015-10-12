var fs = require('fs'),
    path = require('path'),
    nconf = require('nconf'),
    _ = require('underscore'),
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
    'hidden_headers': [],
    'context': {}
});

nconf.get('inject').forEach(function(i) {
    if (i.file) {
        var p = path.resolve(i.file);
        if (!fs.existsSync(p))
            throw "Can't find file: " + i.file;
        console.log("reading payload file "+ p);
        try {
            var data = fs.readFileSync(p, 'utf8');
            i['payload'] = _.template(data);
        } catch (e) {
            console.log("Error processing " + p);
            console.log(e);
        }
        delete i['file']
    }
});

module.exports = exports = nconf
