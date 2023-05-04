import 'mocha';

import mongoose from 'mongoose';
import { expect } from 'chai';

import { services } from './00.setup.spec';

describe('Create Users', async () => {
  it('should create an user `nick` with populated orgs by admin', async () => {
    const orgs: { _id: string }[] = await mongoose.model('Org').find().lean();

    const response = await services.userService.createAdvanced(
      { name: 'nick', role: 'user', orgs: orgs.map((org) => org._id) },
      { select: 'name role orgs', populate: { path: 'orgs' } },
      null,
      { headers: { user: 'admin' } },
    );

    expect(response.status).to.equal(201);
    expect(response.success).to.equal(true);
    expect(response.data.name).to.equal('nick');
    expect(response.data.role).to.equal('user');
    expect(response.data.orgs.length).to.equal(orgs.length);

    for (let x = 0; x < orgs.length; x++) {
      expect(String(orgs[x]._id)).to.equal(response.data.orgs[x]._id);
    }
  });
});
