import request from 'supertest';
import mongoose from 'mongoose';
import { expect } from 'chai';
import 'mocha';

import { app } from './00.setup.spec';

describe('Read-Advanced-Filter User', () => {
  it('should return the target user', async () => {
    const response = await request(app)
      .post('/api/users/__query/__filter')
      .set('user', 'admin')
      .send({ filter: { name: 'john' } })
      .expect('Content-Type', /json/)
      .expect(200);

    expect(response.body.name).to.equal('john');
    expect(response.body._permissions).exist;
  });
});
