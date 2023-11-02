import 'mocha';

import mongoose from 'mongoose';
import { expect } from 'chai';

import { services } from './00.setup.spec';

describe('List-Query Users', () => {
  it('should list all users for admin', async () => {
    const userCount = await mongoose.model('User').countDocuments();

    const response = await services.userService.listAdvanced(null, null, null, { headers: { user: 'admin' } });

    expect(response.status).to.equal(200);
    expect(response.success).to.equal(true);
    expect(response.data.length).to.equal(userCount);
    expect(response.data[0].name).exist;
    expect(response.data[0].role).exist;
    expect(response.data[0]._permissions).to.deep.equal({ _view: { $: '_' }, _edit: { $: '_' } });
  });

  it('should list all public users and `john`', async () => {
    const userCount = await mongoose.model('User').countDocuments({ $or: [{ public: true }, { name: 'john' }] });

    const response = await services.userService.listAdvanced(null, null, null, { headers: { user: 'john' } });

    expect(response.status).to.equal(200);
    expect(response.success).to.equal(true);
    expect(response.data.length).to.equal(userCount);
    expect(response.data[0].name).exist;
    expect(response.data[0].role).not.exist;
    expect(response.data[0]._permissions).to.deep.equal({ _view: { $: '_' }, _edit: { $: '_' } });
  });

  it('should list all public users and `lucy2`', async () => {
    const userCount = await mongoose.model('User').countDocuments({ $or: [{ public: true }, { name: 'lucy2' }] });

    const response = await services.userService.listAdvanced(null, null, null, { headers: { user: 'lucy2' } });

    expect(response.status).to.equal(200);
    expect(response.success).to.equal(true);
    expect(response.data.length).to.equal(userCount);
    expect(response.data[0].name).exist;
    expect(response.data[0].role).not.exist;
    expect(response.data[0]._permissions).to.deep.equal({ _view: { $: '_' }, _edit: { $: '_' } });
  });

  it('should include document count with documents', async () => {
    const userCount = await mongoose.model('User').countDocuments();

    const response = await services.userService.listAdvanced(
      null,
      null,
      { includeCount: true },
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

  it('should include document count that scopes to the session user', async () => {
    const userCount = await mongoose.model('User').countDocuments({ $or: [{ name: 'john' }, { public: true }] });

    const response = await services.userService.listAdvanced(
      null,
      { limit: 1 },
      { includeCount: true },
      { headers: { user: 'john' } },
    );

    expect(response.status).to.equal(200);
    expect(response.success).to.equal(true);
    expect(response.totalCount).to.equal(userCount);
    expect(response.data.length).to.equal(1);
  });

  it('should not include permissions in documents', async () => {
    const response = await services.userService.listAdvanced(
      null,
      null,
      { includePermissions: false },
      { headers: { user: 'admin' } },
    );

    expect(response.status).to.equal(200);
    expect(response.success).to.equal(true);
    expect(response.data[0]._permissions).to.deep.equal({ _view: { $: '_' }, _edit: { $: '_' } });
  });

  it('should return the first user', async () => {
    const users: any = await mongoose.model('User').find({}).limit(1);

    const response = await services.userService.listAdvanced(null, { limit: 1 }, null, { headers: { user: 'admin' } });

    expect(response.status).to.equal(200);
    expect(response.success).to.equal(true);
    expect(response.data.length).to.equal(1);
    expect(response.data[0].name).to.equal(users[0].name);
  });

  it('should return the second user', async () => {
    const users: any = await mongoose.model('User').find({}).limit(1).skip(1);

    const response = await services.userService.listAdvanced(null, { limit: 1, page: 2 }, null, {
      headers: { user: 'admin' },
    });

    expect(response.status).to.equal(200);
    expect(response.success).to.equal(true);
    expect(response.data.length).to.equal(1);
    expect(response.data[0].name).to.equal(users[0].name);
  });

  it('should return the queries user', async () => {
    const response = await services.userService.listAdvanced({ name: 'john' }, null, null, {
      headers: { user: 'admin' },
    });

    expect(response.status).to.equal(200);
    expect(response.success).to.equal(true);
    expect(response.data.length).to.equal(1);
    expect(response.data[0].name).to.equal('john');
    expect(response.data[0].role).exist;
    expect(response.data[0].orgs).exist;
  });

  it('should return the selected fields - 1', async () => {
    const response = await services.userService.listAdvanced({ name: 'john' }, { select: 'name' }, null, {
      headers: { user: 'admin' },
    });

    expect(response.status).to.equal(200);
    expect(response.success).to.equal(true);
    expect(response.data.length).to.equal(1);
    expect(response.data[0].name).to.equal('john');
    expect(response.data[0].role).not.exist;
    expect(response.data[0].orgs).not.exist;
  });

  it('should return the selected fields - 2', async () => {
    const response = await services.userService.listAdvanced({ name: 'john' }, { select: 'name role' }, null, {
      headers: { user: 'admin' },
    });

    expect(response.status).to.equal(200);
    expect(response.success).to.equal(true);
    expect(response.data.length).to.equal(1);
    expect(response.data[0].name).to.equal('john');
    expect(response.data[0].role).to.equal('user');
    expect(response.data[0].orgs).not.exist;
  });

  it('should return the selected fields - 3', async () => {
    const response = await services.userService.listAdvanced({ name: 'john' }, { select: ['name', 'role'] }, null, {
      headers: { user: 'admin' },
    });

    expect(response.status).to.equal(200);
    expect(response.success).to.equal(true);
    expect(response.data.length).to.equal(1);
    expect(response.data[0].name).to.equal('john');
    expect(response.data[0].role).to.equal('user');
    expect(response.data[0].orgs).not.exist;
  });

  it('should return the selected fields - 4', async () => {
    const response = await services.userService.listAdvanced({ name: 'john' }, { select: { name: 1, role: 1 } }, null, {
      headers: { user: 'admin' },
    });

    expect(response.status).to.equal(200);
    expect(response.success).to.equal(true);
    expect(response.data.length).to.equal(1);
    expect(response.data[0].name).to.equal('john');
    expect(response.data[0].role).to.equal('user');
    expect(response.data[0].orgs).not.exist;
  });

  it('should handle invalid select option', async () => {
    const response = await services.userService.listAdvanced({ name: 'john' }, { select: ['name role'] }, null, {
      headers: { user: 'admin' },
    });

    expect(response.status).to.equal(200);
    expect(response.success).to.equal(true);
    expect(response.data.length).to.equal(1);
    expect(response.data[0].name).to.equal('john');
    expect(response.data[0].role).to.equal('user');
    expect(response.data[0].orgs).not.exist;
  });

  it('should return the unpopulated user orgs', async () => {
    const response = await services.userService.listAdvanced({ name: 'john' }, null, null, {
      headers: { user: 'admin' },
    });

    expect(response.status).to.equal(200);
    expect(response.success).to.equal(true);
    expect(response.data.length).to.equal(1);
    expect(response.data[0].name).to.equal('john');
    expect(response.data[0].orgs[0]).to.be.a('string');
  });

  it('should return the populated user orgs', async () => {
    const response = await services.userService.listAdvanced({ name: 'john' }, { populate: 'orgs' }, null, {
      headers: { user: 'admin' },
    });

    expect(response.status).to.equal(200);
    expect(response.success).to.equal(true);
    expect(response.data.length).to.equal(1);
    expect(response.data[0].name).to.equal('john');
    expect(response.data[0].orgs[0]).to.be.a('object');
  });

  it('should return the passed field selection only', async () => {
    const response = await services.userService.listAdvanced({}, { select: '_id' }, null, {
      headers: { user: 'admin' },
    });

    expect(response.status).to.equal(200);
    expect(response.success).to.equal(true);

    expect(response.data[0]._id).to.exist;
    expect(response.data[0].name).to.not.exist;
    expect(response.data[0].orgs).to.not.exist;

    expect(response.data[1]._id).to.exist;
    expect(response.data[1].name).to.not.exist;
    expect(response.data[1].orgs).to.not.exist;
  });
});

describe('List Include', () => {
  it('should include matching user documents with org _id', async () => {
    const response = await services.orgService.listAdvanced(
      {},
      {
        select: '_id',
        include: {
          ref: 'User',
          op: 'list',
          path: 'users',
          localField: '_id',
          foreignField: 'orgs',
        },
      },
      null,
      {
        headers: { user: 'admin' },
      },
    );

    expect(response.status).to.equal(200);
    expect(response.success).to.equal(true);

    expect(response.raw.length).greaterThan(0);
    for (let x = 0; x < response.raw.length; x++) {
      const org = response.raw[x];
      expect(org.users.length).greaterThan(0);
      expect(org.users.every((user) => user.orgs.some((orgId) => String(orgId) === String(org._id)))).to.true;
    }
  });

  it('should include matching a single user document with org _id', async () => {
    const response = await services.orgService.listAdvanced(
      {},
      {
        select: '_id',
        include: [
          {
            ref: 'User',
            op: 'read',
            path: 'users1',
            localField: '_id',
            foreignField: 'orgs',
          },
          {
            ref: 'User',
            op: 'read',
            path: 'users2',
            localField: '_id',
            foreignField: 'orgs',
          },
        ],
      },
      null,
      {
        headers: { user: 'admin' },
      },
    );

    expect(response.status).to.equal(200);
    expect(response.success).to.equal(true);

    for (let x = 0; x < response.raw.length; x++) {
      const org = response.raw[x];

      expect(org.users1).not.empty;
      expect(org.users1.orgs.some((orgId) => String(orgId) === String(org._id))).to.true;

      expect(org.users2).not.empty;
      expect(org.users2.orgs.some((orgId) => String(orgId) === String(org._id))).to.true;
    }
  });
});
