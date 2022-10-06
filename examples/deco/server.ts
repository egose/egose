import initExpresss from './express-server';
import createServer from '../shared/create-server';
import { NODE_ENV, HOSTNAME, PORT } from './config';
const dev = NODE_ENV !== 'production';

async function main() {
  const expressServer = await initExpresss();
  createServer(expressServer, { hostname: HOSTNAME, port: PORT });
}

main();
