import 'mocha';

import mongoose from 'mongoose';
import { expect } from 'chai';

import { services } from './00.setup.spec';

describe('Update Users', () => {
  it('should update an user `john` by admin', async () => {
    const response = await services.userService.updateAdvanced(
      'nick',
      { role: 'admin' },
      { select: 'name role orgs', populate: { path: 'orgs' } },
      null,
      { headers: { user: 'admin' } },
    );

    expect(response.status).to.equal(200);
    expect(response.success).to.equal(true);
    expect(response.data.name).to.equal('nick');
    expect(response.data.role).to.equal('admin');
    expect(response.data.orgs[0]).to.be.an('object');
  });
});
