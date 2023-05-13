import 'mocha';

import { expect } from 'chai';
import { adapter, services } from './00.setup.spec';

import { Model } from '../src/model';

describe('Root Routes - Create User & Count Org', () => {
  it('should create an user `user-root1` and count all orgs by admin', async () => {
    const result = await adapter.group(
      services.userService.create({ name: 'testuser' }, {}, { headers: { user: 'admin' } }),
      services.orgService.count(),
    );

    expect(result.length).to.equal(2);

    expect(result[0].success).to.equal(true);
    expect(result[0].raw).to.exist;
    expect(result[0].data).to.instanceOf(Model);
    expect(result[0].message).to.equal('Created');
    expect(result[0].status).to.equal(201);

    expect(result[1].success).to.equal(true);
    expect(result[1].raw).to.equal(2);
    expect(result[1].data).to.equal(2);
    expect(result[1].message).to.equal('OK');
    expect(result[1].status).to.equal(200);
  });
});
