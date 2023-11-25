import { expect } from 'chai';
import 'mocha';

import { services, endpoints } from './00.setup.spec';

describe('Additional Endpoints', () => {
  it(`should call 'apple' service call from an adapter endpoints`, async () => {
    const pathParams = { name: 'apple' };
    const queryParams = { q1: 'a', q2: 'b' };
    const response = await endpoints.apple({ pathParams, queryParams });

    expect(response.status).to.equal(200);
    expect(response.data.pathParams).deep.equal(pathParams);
    expect(response.data.queryParams).deep.equal(queryParams);
  });

  it(`should call 'chairman' service call from an Org service endpoints`, async () => {
    const response = await endpoints.chairman({ flag: 'pencil' });

    expect(response.status).to.equal(200);
    expect(response.data.name).to.equal('chairman');
    expect(response.data.flag).to.equal('pencil');
  });
});
