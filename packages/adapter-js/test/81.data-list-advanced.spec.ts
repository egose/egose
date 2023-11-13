import { expect } from 'chai';
import 'mocha';

import { services } from './00.setup.spec';

describe('Data List Advanced Routes', () => {
  it('should list all pets for admin', async () => {
    const response = await services.petService.listAdvanced(null, null, null, { headers: { user: 'admin' } });

    expect(response.status).to.equal(200);
    expect(response.success).to.equal(true);
    expect(response.data.length).to.equal(7);
    expect(response.data[0].name).exist;
    expect(response.data[0].age).exist;
    expect(response.data[0].sex).not.exist;
  });

  it('should list all public pets and `john`', async () => {
    const response = await services.petService.listAdvanced(null, null, null, { headers: { user: 'john' } });

    expect(response.status).to.equal(200);
    expect(response.success).to.equal(true);
    expect(response.data.length).to.equal(4);
    expect(response.data[0].name).exist;
    expect(response.data[0].age).not.exist;
    expect(response.data[0].sex).not.exist;
  });

  it('should include document count with documents', async () => {
    const response = await services.petService.listAdvanced(
      null,
      null,
      { includeCount: true },
      { headers: { user: 'admin' } },
    );

    expect(response.status).to.equal(200);
    expect(response.success).to.equal(true);
    expect(response.totalCount).to.equal(7);
    expect(response.data.length).to.equal(7);
    expect(response.data[0].name).exist;
    expect(response.data[0].age).exist;
    expect(response.data[0].sex).not.exist;
  });

  it('should return the first pet', async () => {
    const response = await services.petService.listAdvanced(null, { limit: 1 }, {}, { headers: { user: 'admin' } });

    expect(response.status).to.equal(200);
    expect(response.success).to.equal(true);
    expect(response.data.length).to.equal(1);
    expect(response.data[0].name).to.equal('Max');
  });

  it('should return the second pet', async () => {
    const response = await services.petService.listAdvanced(
      null,
      { limit: 1, page: 2 },
      {},
      { headers: { user: 'admin' } },
    );

    expect(response.status).to.equal(200);
    expect(response.success).to.equal(true);
    expect(response.data.length).to.equal(1);
    expect(response.data[0].name).to.equal('Bella');
  });

  it('should return the queries pet', async () => {
    const response = await services.petService.listAdvanced({ name: 'Max' }, {}, {}, { headers: { user: 'admin' } });

    expect(response.status).to.equal(200);
    expect(response.success).to.equal(true);
    expect(response.data.length).to.equal(1);
    expect(response.data[0].name).to.equal('Max');
    expect(response.data[0].age).exist;
    expect(response.data[0].sex).not.exist;
  });

  it('should return the selected fields', async () => {
    const response = await services.petService.listAdvanced(
      { name: 'Max' },
      { select: 'name' },
      {},
      { headers: { user: 'admin' } },
    );

    expect(response.status).to.equal(200);
    expect(response.success).to.equal(true);
    expect(response.data.length).to.equal(1);
    expect(response.data[0].name).to.equal('Max');
    expect(response.data[0].age).not.exist;
    expect(response.data[0].sex).not.exist;
  });
});
