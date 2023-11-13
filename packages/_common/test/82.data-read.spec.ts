import request from 'supertest';
import { expect } from 'chai';
import 'mocha';

import { app } from './00.setup.spec';

describe('Data Read Routes', () => {
  it('should return the target pet', async () => {
    const response = await request(app)
      .get('/api/pets/Max')
      .set('user', 'admin')
      .expect('Content-Type', /json/)
      .expect(200);

    expect(response.body.name).to.equal('Max');
    expect(response.body.age).exist;
    expect(response.body.sex).exist;
  });
});
