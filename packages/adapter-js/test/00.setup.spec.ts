import 'mocha';

import egoseAdapter from '@egose/adapter-js';
import initExpresss from '@examples/acl/express-server';
import { down, dropDatabase } from '@examples/shared/db';
import { seed } from '@examples/shared/seed';
import createServer from '@examples/shared/create-server';

const DATABASE_URL = 'mongodb://127.0.0.1:27017/adapter-js-test';
export let seedDocuments = {
  admin: {},
  user1: {},
  user2: {},
  user3: {},
  org1: {},
  org2: {},
};

export const adapter = egoseAdapter.createAdapter({ baseURL: 'http://127.0.0.1:3000/api' });

export interface User {
  name?: string;
  role?: string;
  statusHistory?: any[];
  public?: boolean;
  [key: string]: any;
}

export interface Org {
  name?: string;
  locations?: any[];
  [key: string]: any;
}

export const services = {
  userService: adapter.createModelService<User>({ modelName: 'User', basePath: 'users' }),
  orgService: adapter.createModelService<Org>({ modelName: 'Org', basePath: 'orgs' }),
};

before(async function () {
  console.log('setup tests');
  const expressApp = await initExpresss({ databaseUrl: DATABASE_URL });
  await dropDatabase();
  createServer(expressApp, { hostname: '127.0.0.1', port: '3000' });
  seedDocuments = await seed();
});

after(async function () {
  await down({ dropDatabase: true });
});
