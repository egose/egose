import request from 'supertest';
import mongoose from 'mongoose';
import { expect } from 'chai';
import 'mocha';

import { app } from './00.setup.spec';

let upsertyId = null;

describe('Upsert Orgs', () => {
  it('should create an user `upserty` by admin', async () => {
    const response = await request(app)
      .put('/api/orgs')
      .set('user', 'admin')
      .send({ name: 'upserty' })
      .expect('Content-Type', /json/)
      .expect(201);

    expect(response.body._id).exist;
    expect(response.body.name).to.equal('upserty');
    upsertyId = response.body._id;
  });

  it('should update an exisiting user `upserty` by admin', async () => {
    const response = await request(app)
      .put('/api/orgs')
      .set('user', 'admin')
      .send({ _id: upsertyId, name: 'upserty_updated' })
      .expect('Content-Type', /json/)
      .expect(200);

    await mongoose.model('Org').deleteOne({ _id: upsertyId });
    expect(response.body.name).to.equal('upserty_updated');
  });
});
