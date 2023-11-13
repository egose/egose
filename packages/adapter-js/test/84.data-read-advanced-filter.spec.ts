import { expect } from 'chai';
import 'mocha';

import { services } from './00.setup.spec';

describe('Data Read Advanced Filter Routes', () => {
  it('should return the target pet', async () => {
    const response = await services.petService.readAdvancedFilter({ name: 'Max' }, null, null, {
      headers: { user: 'admin' },
    });

    expect(response.status).to.equal(200);
    expect(response.success).to.equal(true);
    expect(response.data.name).to.equal('Max');
    expect(response.data.age).exist;
    expect(response.data.sex).exist;
  });
});
