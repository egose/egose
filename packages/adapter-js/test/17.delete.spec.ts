import 'mocha';

import mongoose from 'mongoose';
import { expect } from 'chai';

import { services } from './00.setup.spec';

describe('Delete User', () => {
  it('should not delete a user by user', async () => {
    const user = await mongoose.model('User').findOne({ name: 'john' });

    const response = await services.userService.delete('john', { headers: { user: 'lucy2' } });

    expect(response.status).to.equal(401);
    expect(response.success).to.equal(false);
    expect(response.data).to.not.equal(String(user._id));
  });

  it('should delete a user by admin', async () => {
    const user = await mongoose.model('User').findOne({ name: 'john' });

    const response = await services.userService.delete('john', { headers: { user: 'admin' } });

    expect(response.status).to.equal(200);
    expect(response.success).to.equal(true);
    expect(response.data).to.equal(String(user._id));
  });
});
