import 'mocha';
import chai, { expect } from 'chai';
import { jestSnapshotPlugin } from 'mocha-chai-jest-snapshot';
import { copyAndDepopulate } from '@egose/acl/src/processors';

chai.use(jestSnapshotPlugin());

describe('Processors - copyAndDepopulate', () => {
  it('should return the expected result - 1', async () => {
    const data = { apple: { _id: 'qwer', name: 'apple' }, pear: { _id: 'asdf', name: 'pear' } };
    const result = copyAndDepopulate(data, [{ src: 'apple', dest: '_apple' }]);
    expect(result).toMatchSnapshot();
  });

  it('should return the expected result - 2', async () => {
    const data = {
      apple: { _id: 'qwer', name: 'apple' },
      pear: {
        _id: 'asdf',
        items: [
          { _id: 1, name: 'item1' },
          { _id: 2, name: 'item2' },
        ],
      },
    };
    const result = copyAndDepopulate(data, [{ src: 'pear.items', dest: '_items' }], { mutable: false });
    expect(result).to.be.not.equal(data);
    expect(result).toMatchSnapshot();
  });

  it('should return the expected result - 3', async () => {
    const data = {
      apple: { _id: 'qwer', name: 'apple' },
      pear: {
        _id: 'asdf',
        items: [
          {
            _id: 1,
            name: 'item1',
            samples: [
              { _id: 1, name: 'sample1' },
              { _id: 2, name: 'sample2' },
            ],
          },
          {
            _id: 2,
            name: 'item2',
            samples: [
              { _id: 3, name: 'sample3' },
              { _id: 4, name: 'sample4' },
            ],
          },
        ],
      },
    };

    const result = copyAndDepopulate(data, [{ src: 'pear.items.samples', dest: '_samples' }], { idField: 'name' });
    expect(result).to.be.equal(data);
    expect(result).toMatchSnapshot();
  });
});
