import request from 'supertest';
import { expect } from 'chai';
import 'mocha';

import { app } from './00.setup.spec';

describe('Update Users', () => {
  it('should update an user `john` by admin', async () => {
    const response = await request(app)
      .patch('/api/users/__mutation/nick')
      .set('user', 'admin')
      .send({
        data: { role: 'admin' },
        select: 'name role orgs',
        populate: { path: 'orgs' },
      })
      .expect('Content-Type', /json/)
      .expect(200);

    expect(response.body.name).to.equal('nick');
    expect(response.body.role).to.equal('admin');
    expect(response.body.orgs[0]).to.be.an('object');
  });
});
