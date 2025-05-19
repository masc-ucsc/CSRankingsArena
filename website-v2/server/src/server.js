const Hapi = require('@hapi/hapi');
const authPlugin = require('./plugins/auth');
const routes = require('./routes/v2');

const init = async () => {
    const server = Hapi.server({
        port: process.env.PORT || 5000,
        host: 'localhost',
        routes: {
            cors: {
                origin: ['http://localhost:3000'],
                headers: ['Accept', 'Content-Type', 'Authorization'],
                additionalHeaders: ['X-Requested-With'],
                credentials: true
            }
        }
    });

    // Register plugins
    await server.register([
        require('@hapi/inert'),
        require('@hapi/vision'),
        authPlugin
    ]);

    // Register routes
    server.route(routes);

    await server.start();
    console.log('Server running on %s', server.info.uri);
};

process.on('unhandledRejection', (err) => {
    console.log(err);
    process.exit(1);
});

init(); 