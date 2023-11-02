import request from 'supertest';
import mongoose from 'mongoose';
import { expect } from 'chai';
import 'mocha';

import { app } from './00.setup.spec';

describe('List-Query Users', () => {
  it('should list all users for admin', async () => {
    const userCount = await mongoose.model('User').countDocuments();

    const response = await request(app)
      .post('/api/users/__query')
      .set('user', 'admin')
      .expect('Content-Type', /json/)
      .expect(200);

    expect(response.body.length).to.equal(userCount);
    expect(response.body[0].name).exist;
    expect(response.body[0].role).exist;
    expect(response.body[0]._permissions).to.deep.equal({ _view: { $: '_' }, _edit: { $: '_' } });
  });

  it('should list all public users and `john`', async () => {
    const userCount = await mongoose.model('User').countDocuments({ $or: [{ public: true }, { name: 'john' }] });

    const response = await request(app)
      .post('/api/users/__query')
      .set('user', 'john')
      .expect('Content-Type', /json/)
      .expect(200);

    expect(response.body.length).to.equal(userCount);
    expect(response.body[0].name).exist;
    expect(response.body[0].role).not.exist;
    expect(response.body[0]._permissions).to.deep.equal({ _view: { $: '_' }, _edit: { $: '_' } });
  });

  it('should list all public users and `lucy2`', async () => {
    const userCount = await mongoose.model('User').countDocuments({ $or: [{ public: true }, { name: 'lucy2' }] });

    const response = await request(app)
      .post('/api/users/__query')
      .set('user', 'lucy2')
      .expect('Content-Type', /json/)
      .expect(200);

    expect(response.body.length).to.equal(userCount);
    expect(response.body[0].name).exist;
    expect(response.body[0].role).not.exist;
    expect(response.body[0]._permissions).to.deep.equal({ _view: { $: '_' }, _edit: { $: '_' } });
  });

  it('should include document count with documents', async () => {
    const userCount = await mongoose.model('User').countDocuments();

    const response = await request(app)
      .post('/api/users/__query')
      .set('user', 'admin')
      .send({ options: { includeCount: true } })
      .expect('Content-Type', /json/)
      .expect(200);

    expect(response.body.count).to.equal(userCount);
    expect(response.body.rows.length).to.equal(userCount);
    expect(response.body.rows[0].name).exist;
    expect(response.body.rows[0].role).exist;
    expect(response.body.rows[0]._permissions).to.deep.equal({ _view: { $: '_' }, _edit: { $: '_' } });
  });

  it('should include document count that scopes to the session user', async () => {
    const userCount = await mongoose.model('User').countDocuments({ $or: [{ name: 'john' }, { public: true }] });

    const response = await request(app)
      .post('/api/users/__query')
      .set('user', 'john')
      .send({ limit: 1, options: { includeCount: true } })
      .expect('Content-Type', /json/)
      .expect(200);

    expect(response.body.count).to.equal(userCount);
    expect(response.body.rows.length).to.equal(1);
  });

  it('should not include permissions in documents', async () => {
    const response = await request(app)
      .post('/api/users/__query')
      .set('user', 'admin')
      .send({ options: { includePermissions: false } })
      .expect('Content-Type', /json/)
      .expect(200);

    expect(response.body[0]._permissions).to.deep.equal({ _view: { $: '_' }, _edit: { $: '_' } });
  });

  it('should return the first user', async () => {
    const users: any = await mongoose.model('User').find({}).limit(1);

    const response = await request(app)
      .post('/api/users/__query')
      .set('user', 'admin')
      .send({ limit: 1 })
      .expect('Content-Type', /json/)
      .expect(200);

    expect(response.body.length).to.equal(1);
    expect(response.body[0].name).to.equal(users[0].name);
  });

  it('should return the second user', async () => {
    const users: any = await mongoose.model('User').find({}).limit(1).skip(1);

    const response = await request(app)
      .post('/api/users/__query')
      .set('user', 'admin')
      .send({ limit: 1, page: 2 })
      .expect('Content-Type', /json/)
      .expect(200);

    expect(response.body.length).to.equal(1);
    expect(response.body[0].name).to.equal(users[0].name);
  });

  it('should return the queries user', async () => {
    const response = await request(app)
      .post('/api/users/__query')
      .set('user', 'admin')
      .send({ filter: { name: 'john' } })
      .expect('Content-Type', /json/)
      .expect(200);

    expect(response.body.length).to.equal(1);
    expect(response.body[0].name).to.equal('john');
    expect(response.body[0].role).exist;
    expect(response.body[0].orgs).exist;
  });

  it('should return the selected fields - 1', async () => {
    const response = await request(app)
      .post('/api/users/__query')
      .set('user', 'admin')
      .send({ filter: { name: 'john' }, select: 'name' })
      .expect('Content-Type', /json/)
      .expect(200);

    expect(response.body.length).to.equal(1);
    expect(response.body[0].name).to.equal('john');
    expect(response.body[0].role).not.exist;
    expect(response.body[0].orgs).not.exist;
  });

  it('should return the selected fields - 2', async () => {
    const response = await request(app)
      .post('/api/users/__query')
      .set('user', 'admin')
      .send({ filter: { name: 'john' }, select: 'name role' })
      .expect('Content-Type', /json/)
      .expect(200);

    expect(response.body.length).to.equal(1);
    expect(response.body[0].name).to.equal('john');
    expect(response.body[0].role).to.equal('user');
    expect(response.body[0].orgs).not.exist;
  });

  it('should return the selected fields - 3', async () => {
    const response = await request(app)
      .post('/api/users/__query')
      .set('user', 'admin')
      .send({ filter: { name: 'john' }, select: ['name', 'role'] })
      .expect('Content-Type', /json/)
      .expect(200);

    expect(response.body.length).to.equal(1);
    expect(response.body[0].name).to.equal('john');
    expect(response.body[0].role).to.equal('user');
    expect(response.body[0].orgs).not.exist;
  });

  it('should return the selected fields - 4', async () => {
    const response = await request(app)
      .post('/api/users/__query')
      .set('user', 'admin')
      .send({ filter: { name: 'john' }, select: { name: 1, role: 1 } })
      .expect('Content-Type', /json/)
      .expect(200);

    expect(response.body.length).to.equal(1);
    expect(response.body[0].name).to.equal('john');
    expect(response.body[0].role).to.equal('user');
    expect(response.body[0].orgs).not.exist;
  });

  it('should handle invalid select option', async () => {
    const response = await request(app)
      .post('/api/users/__query')
      .set('user', 'admin')
      .send({ filter: { name: 'john' }, select: ['name role'] })
      .expect('Content-Type', /json/)
      .expect(200);

    expect(response.body.length).to.equal(1);
    expect(response.body[0].name).to.equal('john');
    expect(response.body[0].role).to.equal('user');
    expect(response.body[0].orgs).not.exist;
  });

  it('should return the unpopulated user orgs', async () => {
    const response = await request(app)
      .post('/api/users/__query')
      .set('user', 'admin')
      .send({ filter: { name: 'john' } })
      .expect('Content-Type', /json/)
      .expect(200);

    expect(response.body.length).to.equal(1);
    expect(response.body[0].name).to.equal('john');
    expect(response.body[0].orgs[0]).to.be.a('string');
  });

  it('should return the populated user orgs', async () => {
    const response = await request(app)
      .post('/api/users/__query')
      .set('user', 'admin')
      .send({ filter: { name: 'john' }, populate: 'orgs' })
      .expect('Content-Type', /json/)
      .expect(200);

    expect(response.body.length).to.equal(1);
    expect(response.body[0].name).to.equal('john');
    expect(response.body[0].orgs[0]).to.be.a('object');
  });

  it('should return the passed field selection only', async () => {
    const response = await request(app)
      .post('/api/users/__query')
      .set('user', 'admin')
      .send({ filter: {}, select: '_id' })
      .expect('Content-Type', /json/)
      .expect(200);

    expect(response.body[0]._id).to.exist;
    expect(response.body[0].name).to.not.exist;
    expect(response.body[0].orgs).to.not.exist;

    expect(response.body[1]._id).to.exist;
    expect(response.body[1].name).to.not.exist;
    expect(response.body[1].orgs).to.not.exist;
  });
});

describe('List Sub-query', () => {
  it('should list orgs queried user.orgs field', async () => {
    const user: any = await mongoose.model('User').findOne({ name: 'lucy2' }).populate('orgs');
    const orgIds = user.orgs.map((v) => String(v._id));

    const response = await request(app)
      .post('/api/orgs/_extra')
      .set('user', 'admin')
      .send({
        filter: {
          _id: {
            $$sq: { model: 'User', op: 'list', sqOptions: { path: 'orgs', compact: true }, filter: { name: 'lucy2' } },
          },
        },
      })
      .expect('Content-Type', /json/)
      .expect(200);

    const result = response.body.map((v) => String(v._id));
    expect(result).deep.equal(orgIds);
  });
});

describe('List Include', () => {
  it('should include matching user documents with org _id', async () => {
    const response = await request(app)
      .post('/api/orgs/_extra')
      .set('user', 'admin')
      .send({
        filter: {},
        include: {
          ref: 'User',
          op: 'list',
          path: 'users',
          localField: '_id',
          foreignField: 'orgs',
        },
      })
      .expect('Content-Type', /json/)
      .expect(200);

    expect(response.body.length).greaterThan(0);
    for (let x = 0; x < response.body.length; x++) {
      const org = response.body[x];
      expect(org.users.length).greaterThan(0);
      expect(org.users.every((user) => user.orgs.some((orgId) => String(orgId) === String(org._id)))).to.true;
    }
  });

  it('should include matching a single user document with org _id', async () => {
    const response = await request(app)
      .post('/api/orgs/_extra')
      .set('user', 'admin')
      .send({
        filter: {},
        include: [
          {
            ref: 'User',
            op: 'read',
            path: 'users1',
            localField: '_id',
            foreignField: 'orgs',
          },
          {
            ref: 'User',
            op: 'read',
            path: 'users2',
            localField: '_id',
            foreignField: 'orgs',
          },
        ],
      })
      .expect('Content-Type', /json/)
      .expect(200);

    expect(response.body.length).greaterThan(0);
    for (let x = 0; x < response.body.length; x++) {
      const org = response.body[x];

      expect(org.users1).not.empty;
      expect(org.users1.orgs.some((orgId) => String(orgId) === String(org._id))).to.true;

      expect(org.users2).not.empty;
      expect(org.users2.orgs.some((orgId) => String(orgId) === String(org._id))).to.true;
    }
  });
});
