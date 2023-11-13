import request from 'supertest';
import { expect } from 'chai';
import 'mocha';

import { app } from './00.setup.spec';

describe('Data Read Advanced Routes', () => {
  it('should return the target pet', async () => {
    const response = await request(app)
      .post('/api/pets/__query/Max')
      .set('user', 'admin')
      .expect('Content-Type', /json/)
      .expect(200);

    expect(response.body.name).to.equal('Max');
    expect(response.body.age).exist;
    expect(response.body.sex).exist;
  });

  it('should return the passed field selection only', async () => {
    const response = await request(app)
      .post('/api/pets/__query/Max')
      .set('user', 'admin')
      .send({ select: 'age' })
      .expect('Content-Type', /json/)
      .expect(200);

    expect(response.body.name).not.exist;
    expect(response.body.age).to.equal(1);
    expect(response.body.sex).not.exist;
  });
});
