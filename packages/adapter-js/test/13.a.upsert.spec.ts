import 'mocha';

import mongoose from 'mongoose';
import { expect } from 'chai';
import { services } from './00.setup.spec';

let upsertyId = null;

describe('Upsert Orgs', () => {
  it('should create an user `upserty` by admin', async () => {
    const response = await services.orgService.upsert({ name: 'upserty' }, null, { headers: { user: 'admin' } });

    expect(response.status).to.equal(201);
    expect(response.success).to.equal(true);
    expect(response.data).exist;
    expect(response.data._id).exist;
    expect(response.data.name).to.equal('upserty');
    upsertyId = response.data._id;
  });

  it('should update an exisiting user `upserty` by admin', async () => {
    const response = await services.orgService.upsert({ _id: upsertyId, name: 'upserty_updated' }, null, {
      headers: { user: 'admin' },
    });

    await mongoose.model('Org').deleteOne({ _id: upsertyId });

    expect(response.status).to.equal(200);
    expect(response.success).to.equal(true);
    expect(response.data).exist;
    expect(response.data._id).exist;
    expect(response.data.name).to.equal('upserty_updated');
  });
});
