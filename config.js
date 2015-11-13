var fs = require('fs'),
    path = require('path'),
    nconfmod = require('nconf'),
    _ = require('underscore');

module.exports = exports = function(overrides) {
    var nconf = new nconfmod.Provider();
    if (overrides)
        nconf.overrides(overrides);

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
        'mask_redirect': false,
        'context': {},
        'targets': [ 'cookie', 'base32' ],
        'redirects': {},
        "error_handlers": [
          'redirect'
        ],
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

    return nconf;
};
