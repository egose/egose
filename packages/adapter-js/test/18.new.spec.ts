import 'mocha';

import mongoose from 'mongoose';
import { expect } from 'chai';

import { services } from './00.setup.spec';

describe('New User', () => {
  it('should return an empty user', async () => {
    const response = await services.userService.new({ headers: { user: 'admin' } });

    expect(response.status).to.equal(200);
    expect(response.success).to.equal(true);
    expect(response.data._id).to.undefined;
    expect(response.data.name).to.equal('');
    expect(response.data.role).to.equal('user');
    expect(response.data.public).to.equal(false);
    expect(response.data.orgs).to.deep.equal([]);
    expect(response.data.statusHistory).to.deep.equal([]);

    response.data.name = 'lucyuser';
    await response.data.save({ headers: { user: 'admin' } });

    expect(response.data._id).to.exist;
    expect(response.data.name).to.equal('lucyuser');
  });
});
