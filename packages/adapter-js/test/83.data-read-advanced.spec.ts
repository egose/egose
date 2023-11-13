import { expect } from 'chai';
import 'mocha';

import { services } from './00.setup.spec';

describe('Data Read Advanced Routes', () => {
  it('should return the target pet', async () => {
    const response = await services.petService.readAdvanced('Max', null, null, { headers: { user: 'admin' } });

    expect(response.status).to.equal(200);
    expect(response.success).to.equal(true);
    expect(response.data.name).to.equal('Max');
    expect(response.data.age).exist;
    expect(response.data.sex).exist;
  });

  it('should return the passed field selection only', async () => {
    const response = await services.petService.readAdvanced('Max', { select: 'age' }, null, {
      headers: { user: 'admin' },
    });

    expect(response.status).to.equal(200);
    expect(response.success).to.equal(true);
    expect(response.data.name).not.exist;
    expect(response.data.age).to.equal(1);
    expect(response.data.sex).not.exist;
  });
});
