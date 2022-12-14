const debug = require('debug')('seq:server');
const http = require('http');

const createServer = (expressServer, options: { hostname?: string; port?: string | number } = {}) => {
  let { hostname, port } = options;
  port = normalizePort(port);
  expressServer.set('port', port);

  const server = http.createServer(expressServer);

  server.listen(port, hostname, () => {
    console.log(`Server running at http://${hostname}:${port}/`);
  });

  server.on('error', onError);
  server.on('listening', onListening);

  function onError(error) {
    if (error.syscall !== 'listen') {
      throw error;
    }

    const bind = typeof port === 'string' ? 'Pipe ' + port : 'Port ' + port;

    // handle specific listen errors with friendly messages
    switch (error.code) {
      case 'EACCES':
        console.error(bind + ' requires elevated privileges');
        process.exit(1);

      case 'EADDRINUSE':
        console.error(bind + ' is already in use');
        process.exit(1);

      default:
        throw error;
    }
  }

  function onListening() {
    const addr = server.address();
    const bind = typeof addr === 'string' ? 'pipe ' + addr : 'port ' + addr.port;
    debug('Listening on ' + bind);
  }
};

function normalizePort(val) {
  const port = parseInt(val, 10);

  if (Number.isNaN(port)) {
    // named pipe
    return val;
  }

  if (port >= 0) {
    // port number
    return port;
  }

  return false;
}

export default createServer;
