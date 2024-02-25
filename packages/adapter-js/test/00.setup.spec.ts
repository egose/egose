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
export const adapterWithCache = egoseAdapter.createAdapter({ baseURL: 'http://127.0.0.1:3000/api' }, { cacheTTL: 100 });

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

export interface Pet {
  name?: string;
  age?: number;
  sex?: string;
  [key: string]: any;
}

export const services = {
  userService: adapter.createModelService<User>({ modelName: 'User', basePath: 'users' }),
  userServiceWithError: adapter.createModelService<User>({
    modelName: 'User',
    basePath: 'users',
    suppressError: false,
  }),
  orgService: adapter.createModelService<Org>({ modelName: 'Org', basePath: 'orgs', queryPath: '_extra' }),
  petService: adapter.createDataService<Pet>({ dataName: 'Pet', basePath: 'pets' }),
  userService2: adapterWithCache.createModelService<User>({ modelName: 'User', basePath: 'users' }),
};

export const endpoints = {
  apple: adapter.wrapGet('/apple/{{name}}'),
  chairman: services.orgService.wrapPost<{ name: string; flag: string }>('/chairman'),
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
