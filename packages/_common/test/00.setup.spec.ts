import 'mocha';

import { down, dropDatabase } from '@examples/shared/db';
import { seed } from '@examples/shared/seed';

const DATABASE_URL = 'mongodb://localhost:27017/acl-test';

export let app = null;
export async function initApp(initFn) {
  console.log('init app');
  app = await initFn({ databaseUrl: DATABASE_URL });
  await dropDatabase();
  seedDocuments = await seed();
}

export function getApp() {
  return app;
}

export let seedDocuments: { admin: any; user1: any; user2: any; user3: any; org1: any; org2: any } = {
  admin: {},
  user1: {},
  user2: {},
  user3: {},
  org1: {},
  org2: {},
};

after(async function () {
  await down({ dropDatabase: true });
});
