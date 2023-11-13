import request from 'supertest';
import { expect } from 'chai';
import 'mocha';

import { app } from '../../_common/test/00.setup.spec';

describe('Data Read Advanced Filter Routes', () => {
  it('should return the target pet', async () => {
    const response = await request(app)
      .post('/api/pets/__query/__filter')
      .set('user', 'admin')
      .send({ filter: { name: 'Max' } })
      .expect('Content-Type', /json/)
      .expect(200);

    expect(response.body.name).to.equal('Max');
    expect(response.body.age).exist;
    expect(response.body.sex).exist;
  });
});
