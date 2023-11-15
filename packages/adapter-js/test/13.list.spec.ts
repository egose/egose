import 'mocha';

import mongoose from 'mongoose';
import { expect } from 'chai';

import { services } from './00.setup.spec';

describe('List Users', () => {
  it('should list all users for admin', async () => {
    const userCount = await mongoose.model('User').countDocuments();

    const response = await services.userService.list(null, null, { headers: { user: 'admin' } });

    expect(response.status).to.equal(200);
    expect(response.success).to.equal(true);
    expect(response.data.length).to.equal(userCount);
    expect(response.data[0].name).exist;
    expect(response.data[0].role).exist;
    expect(response.data[0]._permissions).to.deep.equal({ _view: { $: '_' }, _edit: { $: '_' } });
  });

  it('should list all public users and `john`', async () => {
    const userCount = await mongoose.model('User').countDocuments({ $or: [{ public: true }, { name: 'john' }] });

    const response = await services.userService.list(null, null, { headers: { user: 'john' } });

    expect(response.status).to.equal(200);
    expect(response.success).to.equal(true);
    expect(response.data.length).to.equal(userCount);
    expect(response.data[0].name).exist;
    expect(response.data[0].role).not.exist;
    expect(response.data[0]._permissions).to.deep.equal({ _view: { $: '_' }, _edit: { $: '_' } });
  });

  it('should list all public users and `lucy2`', async () => {
    const userCount = await mongoose.model('User').countDocuments({ $or: [{ public: true }, { name: 'lucy2' }] });

    const response = await services.userService.list(null, null, { headers: { user: 'lucy2' } });

    expect(response.status).to.equal(200);
    expect(response.success).to.equal(true);
    expect(response.data.length).to.equal(userCount);
    expect(response.data[0].name).exist;
    expect(response.data[0].role).not.exist;
    expect(response.data[0]._permissions).to.deep.equal({ _view: { $: '_' }, _edit: { $: '_' } });
  });

  it('should include total count', async () => {
    const userCount = await mongoose.model('User').countDocuments();

    const response = await services.userService.list(null, { includeCount: true }, { headers: { user: 'admin' } });

    expect(response.status).to.equal(200);
    expect(response.success).to.equal(true);
    expect(response.totalCount).to.equal(userCount);
    expect(response.data.length).to.equal(userCount);
    expect(response.data[0].name).exist;
    expect(response.data[0].role).exist;
    expect(response.data[0]._permissions).to.deep.equal({ _view: { $: '_' }, _edit: { $: '_' } });
  });

  it('should include total count via headers', async () => {
    const userCount = await mongoose.model('User').countDocuments();

    const response = await services.userService.list(
      null,
      { includeCount: true, includeExtraHeaders: true },
      { headers: { user: 'admin' } },
    );

    expect(response.status).to.equal(200);
    expect(response.success).to.equal(true);
    expect(response.totalCount).to.equal(userCount);
    expect(response.data.length).to.equal(userCount);
    expect(response.data[0].name).exist;
    expect(response.data[0].role).exist;
    expect(response.data[0]._permissions).to.deep.equal({ _view: { $: '_' }, _edit: { $: '_' } });
  });

  it('should not include permissions in documents', async () => {
    const response = await services.userService.list(
      null,
      { includePermissions: false },
      { headers: { user: 'admin' } },
    );

    expect(response.data[0]._permissions).to.deep.equal({ _view: { $: '_' }, _edit: { $: '_' } });
  });

  it('should return the first user', async () => {
    const users: any = await mongoose.model('User').find({}).limit(1);

    const response = await services.userService.list({ limit: 1 }, null, { headers: { user: 'admin' } });

    expect(response.status).to.equal(200);
    expect(response.success).to.equal(true);
    expect(response.data.length).to.equal(1);
    expect(response.data[0].name).to.equal(users[0].name);
  });

  it('should return the second user', async () => {
    const users: any = await mongoose.model('User').find({}).limit(1).skip(1);

    const response = await services.userService.list({ limit: 1, page: 2 }, null, { headers: { user: 'admin' } });

    expect(response.status).to.equal(200);
    expect(response.success).to.equal(true);
    expect(response.data.length).to.equal(1);
    expect(response.data[0].name).to.equal(users[0].name);
  });
});
