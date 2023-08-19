import request from 'supertest';
import { expect } from 'chai';
import 'mocha';

import { app } from './00.setup.spec';

describe('Update Users', () => {
  it('should update an user `john` by admin incl. `permissions` field', async () => {
    const response = await request(app)
      .patch('/api/users/__mutation/nick')
      .set('user', 'admin')
      .send({
        data: { role: 'admin' },
        select: 'name role orgs',
        populate: { path: 'orgs' },
        options: {
          includePermissions: true,
        },
      })
      .expect('Content-Type', /json/)
      .expect(200);

    expect(response.body.name).to.equal('nick');
    expect(response.body.role).to.equal('admin');
    expect(response.body.orgs[0]).to.be.an('object');
    expect(response.body._permissions).exist;
  });

  it('should update an user `john` by admin excl. `permissions` field', async () => {
    const response = await request(app)
      .patch('/api/users/__mutation/nick')
      .set('user', 'admin')
      .send({
        data: { role: 'admin' },
        select: 'name role orgs',
        populate: { path: 'orgs' },
        options: {
          includePermissions: false,
        },
      })
      .expect('Content-Type', /json/)
      .expect(200);

    expect(response.body.name).to.equal('nick');
    expect(response.body.role).to.equal('admin');
    expect(response.body.orgs[0]).to.be.an('object');
    expect(response.body._permissions).not.exist;
  });
});
