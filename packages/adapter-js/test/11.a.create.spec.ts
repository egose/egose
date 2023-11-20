import 'mocha';

import { expect } from 'chai';
import { adapter, services } from './00.setup.spec';

describe('Create Users', () => {
  it('should create an user `john` by admin', async () => {
    const response = await services.userService.create({ name: 'john', role: 'user', public: false }, null, {
      headers: { user: 'admin' },
    });

    expect(response.status).to.equal(201);
    expect(response.success).to.equal(true);
    expect(response.data.name).to.equal('john');
    expect(response.data.role).to.equal('user');
    expect(response.data.public).to.equal(false);
  });

  it('should create an user `lucy` by admin', async () => {
    const response = await services.userService.createAdvanced(
      { name: 'lucy', role: 'user', public: true },
      { select: { name: 1, role: 1, public: 1, _createdBy: 1 } },
      null,
      { headers: { user: 'admin' } },
    );

    expect(response.status).to.equal(201);
    expect(response.success).to.equal(true);
    expect(response.data.name).to.equal('lucy');
    expect(response.data.role).to.equal('user');
    expect(response.data.public).to.equal(true);
    expect(response.data._createdBy).to.equal('egose');
  });

  it('should create an user `kathy` by admin', async () => {
    const response = await services.userService.createAdvanced(
      { name: 'kathy', role: 'user', public: true },
      { select: { name: 1, role: 1, public: 1, _createdBy: 1 } },
      null,
      { headers: { user: 'admin' } },
    );

    expect(response.status).to.equal(201);
    expect(response.success).to.equal(true);
    expect(response.data.name).to.equal('kathy');
    expect(response.data.role).to.equal('user');
    expect(response.data.public).to.equal(true);
    expect(response.data._createdBy).to.equal('egose');
  });
});

describe('Create Orgs', () => {
  it('should create an org `red` by admin', async () => {
    const response = await services.orgService.create({ name: 'red' }, null, { headers: { user: 'admin' } });

    expect(response.status).to.equal(201);
    expect(response.success).to.equal(true);
    expect(response.data.name).to.equal('red');
  });

  it('should create an org `blue` by admin', async () => {
    const response = await services.orgService.create({ name: 'blue' }, null, { headers: { user: 'admin' } });

    expect(response.status).to.equal(201);
    expect(response.success).to.equal(true);
    expect(response.data.name).to.equal('blue');
  });

  it('should create an org `purple` by admin', async () => {
    const response = await services.orgService.createAdvanced({ name: 'purple' }, { select: '_id' }, null, {
      headers: { user: 'admin' },
    });

    expect(response.status).to.equal(201);
    expect(response.success).to.equal(true);
    expect(response.data.name).to.undefined;
  });
});
