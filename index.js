var mkconf = require('./config'),
    proxy = require('./proxy');
module.exports = exports = {
    get conf() {
        return mkconf();
    },
    proxy: require('./proxy')
};
