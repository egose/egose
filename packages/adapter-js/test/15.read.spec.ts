import 'mocha';

import mongoose from 'mongoose';
import { expect } from 'chai';

import { services } from './00.setup.spec';

describe('Read User', () => {
  it('should return the target user', async () => {
    const response = await services.userService.read('john', null, { headers: { user: 'admin' } });

    expect(response.status).to.equal(200);
    expect(response.success).to.equal(true);
    expect(response.data.name).to.equal('john');
    expect(response.data._permissions).not.deep.equal({ _view: { $: '_' }, _edit: { $: '_' } });
  });

  it('should not return the target user by read privilege', async () => {
    const response = await services.userService.read('lucy', { tryList: false }, { headers: { user: 'john' } });

    expect(response.status).to.equal(404);
    expect(response.success).to.equal(false);
    expect(response.message).to.equal('Not Found');
  });

  it('should return the target user by list privilege', async () => {
    const response = await services.userService.read('lucy2', { tryList: true }, { headers: { user: 'john' } });

    expect(response.status).to.equal(200);
    expect(response.success).to.equal(true);
    expect(response.data.name).to.equal('lucy2');
  });

  it('should not include document permissions', async () => {
    const response = await services.userService.read(
      'lucy2',
      { includePermissions: false },
      { headers: { user: 'admin' } },
    );

    expect(response.status).to.equal(200);
    expect(response.success).to.equal(true);
    expect(response.data._permissions).to.deep.equal({ _view: { $: '_' }, _edit: { $: '_' } });
  });
});
