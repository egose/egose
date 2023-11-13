import request from 'supertest';
import { expect } from 'chai';
import 'mocha';

import { app } from './00.setup.spec';

describe('Data List Routes', () => {
  it('should list all pets for admin', async () => {
    const response = await request(app)
      .get('/api/pets')
      .set('user', 'admin')
      .expect('Content-Type', /json/)
      .expect(200);

    expect(response.body.length).to.equal(7);
    expect(response.body[0].name).exist;
    expect(response.body[0].age).exist;
    expect(response.body[0].sex).not.exist;
  });

  it('should list all public users and `john`', async () => {
    const response = await request(app).get('/api/pets').set('user', 'john').expect('Content-Type', /json/).expect(200);

    expect(response.body.length).to.equal(4);
    expect(response.body[0].name).exist;
    expect(response.body[0].age).not.exist;
    expect(response.body[0].sex).not.exist;
  });

  it('should include document count with documents', async () => {
    const response = await request(app)
      .get('/api/pets?include_count=true')
      .set('user', 'admin')
      .expect('Content-Type', /json/)
      .expect(200);

    expect(response.body.count).to.equal(7);
    expect(response.body.rows.length).to.equal(7);
    expect(response.body.rows[0].name).exist;
    expect(response.body.rows[0].age).exist;
    expect(response.body.rows[0].sex).not.exist;
  });

  it('should return the first pet', async () => {
    const response = await request(app)
      .get('/api/pets?limit=1')
      .set('user', 'admin')
      .expect('Content-Type', /json/)
      .expect(200);

    expect(response.body.length).to.equal(1);
    expect(response.body[0].name).to.equal('Max');
  });

  it('should return the second pet', async () => {
    const response = await request(app)
      .get('/api/pets?limit=1&page=2')
      .set('user', 'admin')
      .expect('Content-Type', /json/)
      .expect(200);

    expect(response.body.length).to.equal(1);
    expect(response.body[0].name).to.equal('Bella');
  });
});
