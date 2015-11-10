module.exports = exports = {
    get conf() {
        return require('./config.js');
    },
    proxy: require('./proxy')
};
