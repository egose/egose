import initExpresss from '@examples/acl/express-server';
import { initApp } from '@egose/_common/test/00.setup.spec';

before(async function () {
  console.log('setup tests');
  await initApp(({ databaseUrl }) => initExpresss({ databaseUrl }));
});
