import 'mocha';

import mongoose from 'mongoose';

before(async function () {
  const DATABASE_URL = 'mongodb://127.0.0.1:27017/moo-test';
  await mongoose.connect(DATABASE_URL);
});

after(async function () {
  await mongoose.connection.db.dropDatabase();
});
