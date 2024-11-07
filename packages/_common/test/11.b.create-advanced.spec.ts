import request from 'supertest';
import mongoose from 'mongoose';
import { expect } from 'chai';
import 'mocha';

import { app } from './00.setup.spec';

describe('Create Users', async () => {
  it('should create an user `nick` with populated orgs by admin', async () => {
    // @ts-ignore
    const orgs = await mongoose.model('Org').find().lean();

    const response = await request(app)
      .post('/api/users/__mutation')
      .set('user', 'admin')
      .send({
        data: { name: 'nick', role: 'user', orgs: orgs.map((org) => org._id) },
        select: 'name role orgs',
        populate: { path: 'orgs' },
      })
      .expect('Content-Type', /json/)
      .expect(201);

    expect(response.body.name).to.equal('nick');
    expect(response.body.role).to.equal('user');
    expect(response.body.orgs.length).to.equal(orgs.length);

    for (let x = 0; x < orgs.length; x++) {
      expect(String(orgs[x]._id)).to.equal(response.body.orgs[x]._id);
    }
  });
});
