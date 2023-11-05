import 'mocha';

import mongoose from 'mongoose';
import { expect } from 'chai';

import { services } from './00.setup.spec';

describe('Read-Query User', () => {
  it('should return the target user', async () => {
    const response = await services.userService.readAdvanced('john', null, null, { headers: { user: 'admin' } });

    expect(response.status).to.equal(200);
    expect(response.success).to.equal(true);
    expect(response.data.name).to.equal('john');
    expect(response.data._permissions).not.deep.equal({ _view: { $: '_' }, _edit: { $: '_' } });
  });

  it('should not return the target user by read privilege', async () => {
    const response = await services.userService.readAdvanced('lucy', null, null, { headers: { user: 'john' } });

    expect(response.status).to.equal(404);
    expect(response.success).to.equal(false);
    expect(response.message).to.equal('Not Found');
  });

  it('should return the target user by list privilege', async () => {
    const response = await services.userService.readAdvanced(
      'lucy2',
      null,
      { tryList: true },
      { headers: { user: 'john' } },
    );

    expect(response.status).to.equal(200);
    expect(response.success).to.equal(true);
    expect(response.data.name).to.equal('lucy2');
  });

  it('should not include document permissions', async () => {
    const response = await services.userService.readAdvanced(
      'lucy2',
      null,
      { includePermissions: false },
      { headers: { user: 'admin' } },
    );

    expect(response.status).to.equal(200);
    expect(response.success).to.equal(true);
    expect(response.data._permissions).to.deep.equal({ _view: { $: '_' }, _edit: { $: '_' } });
  });

  it('should return the unpopulated user orgs', async () => {
    const response = await services.userService.readAdvanced('lucy2', null, null, { headers: { user: 'john' } });

    expect(response.status).to.equal(200);
    expect(response.success).to.equal(true);
    expect(response.data.name).to.equal('lucy2');
    expect(response.data.orgs[0]).to.be.a('string');
  });

  it('should return the populated user orgs with list access', async () => {
    const response = await services.userService.readAdvanced('lucy2', { populate: 'orgs' }, null, {
      headers: { user: 'john' },
    });

    expect(response.status).to.equal(200);
    expect(response.success).to.equal(true);
    expect(response.data.name).to.equal('lucy2');
    expect(response.data.orgs.length).to.equal(2);
    expect(response.data.orgs[0]).to.be.a('object');
  });

  it('should return the populated user orgs with list access', async () => {
    const response = await services.userService.readAdvanced(
      'lucy2',
      { populate: { path: 'orgs', access: 'list' } },
      null,
      { headers: { user: 'john' } },
    );

    expect(response.status).to.equal(200);
    expect(response.success).to.equal(true);
    expect(response.data.name).to.equal('lucy2');
    expect(response.data.orgs.length).to.equal(2);
    expect(response.data.orgs[0]).to.be.a('object');
  });

  it('should return the passed field selection only', async () => {
    const response = await services.userService.readAdvanced('lucy2', { select: '_id' }, null, {
      headers: { user: 'admin' },
    });

    expect(response.status).to.equal(200);
    expect(response.success).to.equal(true);
    expect(response.data._id).to.exist;
    expect(response.data.name).to.not.exist;
    expect(response.data.orgs).to.not.exist;
  });

  it('should exclude _id field', async () => {
    const response = await services.userService.readAdvanced('lucy2', { select: '-_id name' }, null, {
      headers: { user: 'admin' },
    });

    expect(response.status).to.equal(200);
    expect(response.success).to.equal(true);
    expect(response.data._id).to.not.exist;
    expect(response.data.name).to.exist;
  });

  it('should exclude _id field', async () => {
    const response = await services.userService.readAdvanced('lucy2', { select: ['-_id', 'name'] }, null, {
      headers: { user: 'admin' },
    });

    expect(response.status).to.equal(200);
    expect(response.success).to.equal(true);
    expect(response.data._id).to.not.exist;
    expect(response.data.name).to.exist;
  });

  it('should exclude _id field', async () => {
    const response = await services.userService.readAdvanced('lucy2', { select: { _id: -1, name: 1 } }, null, {
      headers: { user: 'admin' },
    });

    expect(response.status).to.equal(200);
    expect(response.success).to.equal(true);
    expect(response.data._id).to.not.exist;
    expect(response.data.name).to.exist;
  });

  it('should exclude _id and name fields', async () => {
    const response = await services.userService.readAdvanced('lucy2', { select: '-_id -name' }, null, {
      headers: { user: 'admin' },
    });

    expect(response.status).to.equal(200);
    expect(response.success).to.equal(true);
    expect(response.data._id).to.not.exist;
    expect(response.data.name).to.not.exist;
    expect(response.data.role).to.exist;
    expect(response.data.public).to.exist;
    expect(response.data.statusHistory).to.exist;
    expect(response.data.orgs).to.exist;
  });

  it('should exclude _id and name fields', async () => {
    const response = await services.userService.readAdvanced('lucy2', { select: ['-_id', '-name'] }, null, {
      headers: { user: 'admin' },
    });

    expect(response.status).to.equal(200);
    expect(response.success).to.equal(true);
    expect(response.data._id).to.not.exist;
    expect(response.data.name).to.not.exist;
    expect(response.data.role).to.exist;
    expect(response.data.public).to.exist;
    expect(response.data.statusHistory).to.exist;
    expect(response.data.orgs).to.exist;
  });

  it('should exclude _id and name fields', async () => {
    const response = await services.userService.readAdvanced('lucy2', { select: { _id: -1, name: -1 } }, null, {
      headers: { user: 'admin' },
    });

    expect(response.status).to.equal(200);
    expect(response.success).to.equal(true);
    expect(response.data._id).to.not.exist;
    expect(response.data.name).to.not.exist;
    expect(response.data.role).to.exist;
    expect(response.data.public).to.exist;
    expect(response.data.statusHistory).to.exist;
    expect(response.data.orgs).to.exist;
  });
});

describe('List Include', () => {
  it('should include matching org documents with orgs', async () => {
    const response = await services.userService.readAdvanced(
      'lucy2',
      {
        include: {
          model: 'Org',
          op: 'list',
          path: 'orgs1',
          localField: 'orgs',
          foreignField: '_id',
        },
      },
      null,
      { headers: { user: 'admin' } },
    );

    expect(response.status).to.equal(200);
    expect(response.success).to.equal(true);

    expect(response.raw.orgs1.length).to.equal(response.raw.orgs.length);
    for (let x = 0; x < response.raw.orgs1.length; x++) {
      const org = response.raw.orgs1[x];
      expect(String(org._id)).to.equal(String(response.raw.orgs[x]));
    }
  });

  it('should include matching a single org document with orgs', async () => {
    const response = await services.userService.readAdvanced(
      'lucy2',
      {
        include: [
          {
            model: 'Org',
            op: 'read',
            path: 'orgs1',
            localField: 'orgs',
            foreignField: '_id',
          },
          {
            model: 'Org',
            op: 'read',
            path: 'orgs2',
            localField: 'orgs',
            foreignField: '_id',
          },
        ],
      },
      null,
      { headers: { user: 'admin' } },
    );

    expect(response.status).to.equal(200);
    expect(response.success).to.equal(true);

    expect(response.raw.orgs1).not.empty;
    expect(response.raw.orgs2).not.empty;
  });
});
