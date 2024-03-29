import request from 'supertest';
import { expect } from 'chai';
import 'mocha';

import { app } from './00.setup.spec';

describe('Create Users', () => {
  it('should create an user `john` by admin', async () => {
    const response = await request(app)
      .post('/api/users')
      .set('user', 'admin')
      .send({ name: 'john', role: 'user', public: false })
      .expect('Content-Type', /json/)
      .expect(201);

    expect(response.body.name).to.equal('john');
    expect(response.body.role).to.equal('user');
    expect(response.body.public).to.equal(false);
  });

  it('should create an user `lucy` by admin', async () => {
    const response = await request(app)
      .post('/api/users/__mutation')
      .set('user', 'admin')
      .send({
        data: { name: 'lucy', role: 'user', public: true },
        select: { name: 1, role: 1, public: 1, _createdBy: 1 },
      })
      .expect('Content-Type', /json/)
      .expect(201);

    expect(response.body.name).to.equal('lucy');
    expect(response.body.role).to.equal('user');
    expect(response.body.public).to.equal(true);
    expect(response.body._createdBy).to.equal('egose');
  });
});

describe('Create Orgs', () => {
  it('should create an org `red` by admin', async () => {
    const response = await request(app)
      .post('/api/orgs')
      .set('user', 'admin')
      .send({ name: 'red' })
      .expect('Content-Type', /json/)
      .expect(201);

    expect(response.body.name).to.equal('red');
  });

  it('should create an org `blue` by admin', async () => {
    const response = await request(app)
      .post('/api/orgs')
      .set('user', 'admin')
      .send({ name: 'blue' })
      .expect('Content-Type', /json/)
      .expect(201);

    expect(response.body.name).to.equal('blue');
  });

  it('should create an org `purple` by admin', async () => {
    const response = await request(app)
      .post('/api/orgs/__mutation')
      .set('user', 'admin')
      .send({ data: { name: 'purple' }, select: '_id' })
      .expect('Content-Type', /json/)
      .expect(201);

    expect(response.body.name).to.undefined;
  });
});
