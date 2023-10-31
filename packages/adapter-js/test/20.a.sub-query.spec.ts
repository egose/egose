import mongoose from 'mongoose';
import 'mocha';

import { expect } from 'chai';
import { adapter, services } from './00.setup.spec';

describe('Sub Query', () => {
  it('should list orgs queried user.orgs field', async () => {
    const user: any = await mongoose.model('User').findOne({ name: 'lucy2' }).populate('orgs');
    const orgIds = user.orgs.map((v) => String(v._id));
    const response = await services.orgService.listAdvanced(
      {
        _id: services.userService.readAdvancedFilter({ name: 'lucy2' }, {}, { sq: { path: 'orgs', compact: true } }),
      },
      {},
      {},
      { headers: { user: 'admin' } },
    );

    expect(response.status).to.equal(200);
    expect(response.success).to.equal(true);

    const result = response.raw.map((v) => String(v._id));
    expect(result).deep.equal(orgIds);
  });
});
