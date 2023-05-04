import 'mocha';

import mongoose from 'mongoose';
import { expect } from 'chai';

import { services } from './00.setup.spec';

describe('Update Users', () => {
  it('should update an user `john` by admin', async () => {
    const orgs = await mongoose.model('Org').find({ name: 'red' });
    const statusDocument = await mongoose.model('Document').create({ name: 'registration form' });

    const response = await services.userService.update(
      'john',
      {
        orgs: orgs.map((org) => org._id),
        statusHistory: [{ name: 'junior', approved: true, document: statusDocument }],
      },
      null,
      { headers: { user: 'admin' } },
    );

    expect(response.status).to.equal(200);
    expect(response.success).to.equal(true);
    expect(response.data.name).to.equal('john');
    expect(response.data.orgs[0]).to.equal(String(orgs[0]._id));
    expect(response.data.statusHistory[0].name).to.equal('junior');
  });

  it('should update an user `lucy` by admin', async () => {
    const orgs = await mongoose.model('Org').find({ name: ['blue', 'purple'] });
    const statusDocument = await mongoose.model('Document').create({ name: 'registration form' });

    const response = await services.userService.update(
      'lucy',
      {
        orgs: orgs.map((org) => org._id),
        statusHistory: [
          { name: 'junior', approved: false, document: statusDocument },
          { name: 'senior', approved: true },
        ],
      },
      null,
      { headers: { user: 'admin' } },
    );

    expect(response.status).to.equal(200);
    expect(response.success).to.equal(true);
    expect(response.data.name).to.equal('lucy');
    expect(response.data.orgs.length).to.equal(2);
    expect(response.data.statusHistory[0].approved).to.equal(false);
  });

  it('should update allowed fields for `lucy`', async () => {
    const response = await services.userService.update(
      'lucy',
      {
        name: 'lucy2',
        orgs: [],
        statusHistory: [],
      },
      null,
      { headers: { user: 'lucy' } },
    );

    expect(response.status).to.equal(200);
    expect(response.success).to.equal(true);
    expect(response.data.name).to.equal('lucy2');
    expect(response.data.orgs.length).to.equal(2);
    expect(response.data.statusHistory).to.be.undefined;
  });

  it('should returning all fields', async () => {
    const response = await services.userService.update('lucy2', { public: false }, null, {
      headers: { user: 'admin' },
    });

    expect(response.status).to.equal(200);
    expect(response.success).to.equal(true);
    expect(response.data.name).to.exist;
    expect(response.data.role).to.exist;
    expect(response.data.public).to.exist;
    expect(response.data.statusHistory).to.exist;
    expect(response.data.orgs).to.exist;
  });

  it('should returning updated fields only', async () => {
    const response = await services.userService.update(
      'lucy2',
      { public: false },
      { returningAll: false },
      { headers: { user: 'admin' } },
    );

    expect(response.status).to.equal(200);
    expect(response.success).to.equal(true);
    expect(response.data.name).to.not.exist;
    expect(response.data.role).to.not.exist;
    expect(response.data.public).to.exist;
    expect(response.data.statusHistory).to.not.exist;
    expect(response.data.orgs).to.not.exist;
  });

  it('should generate permission data again after updating doc', async () => {
    const response = await services.userService.update('lucy2', { public: false }, null, {
      headers: { user: 'admin' },
    });

    expect(response.data._permissions['test:public']).to.equal(false);

    const response2 = await services.userService.update('lucy2', { public: true }, null, {
      headers: { user: 'admin' },
    });

    expect(response2.data._permissions['test:public']).to.equal(true);
  });
});
