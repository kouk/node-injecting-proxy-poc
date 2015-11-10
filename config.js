var fs = require('fs'),
    path = require('path'),
    nconf = require('nconf'),
    _ = require('underscore');

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

var defaultConfigFile = path.resolve( 'config.json' );
if (fs.existsSync(defaultConfigFile)) {
    console.log("Reading config from: " + defaultConfigFile);
    nconf = nconf.file('default', {file: defaultConfigFile});
}
nconf = nconf.defaults({
    'inject': [],
    'replace': [],
    'port': 80,
    'secure':false,
    'ssl': false,
    'suffix': "livelocal:8000",
    'listen': "127.0.0.1",
    'cookie_prefix': '',
    'hidden_headers': [],
    'proto_separator': '-',
    'context': {},
    'pages': {},
    'targets': [ 'cookie', 'base32' ],
    'deactivateExternal': false
});

nconf.get('inject').forEach(function(i) {
    if (i.file) {
        var p = path.resolve(i.file);
        if (!fs.existsSync(p))
            throw "Can't find file: " + i.file;
        console.log("reading payload file "+ p);
        try {
            var data = fs.readFileSync(p, 'utf8');
            i.payload = _.template(data);
        } catch (e) {
            console.log("Error processing " + p);
            console.log(e);
        }
        delete i.file;
    } else if (i.payload) {
        try {
            i.payload = _.template(i.payload);
        } catch (e) {
            console.log("Error processing: " + i.payload);
            console.log(e);
        }
    }
});

templates = {};
_.each(nconf.get('pages'), function(file, k) {
    var data, p = path.resolve();
    if (!fs.existsSync(p))
        throw "Can't find file: " + file;
    try {
        data = fs.readFileSync(p, 'utf8');
        templates[k] = _.template(data);
    } catch (e) {
        console.log("Error processing " + p);
        console.log(e);
    }
});

nconf.set('templates', templates);

module.exports = exports = nconf;
