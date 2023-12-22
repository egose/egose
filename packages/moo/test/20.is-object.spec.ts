import 'mocha';
import mongoose from 'mongoose';
import { expect } from 'chai';
import './00.setup.spec';
import { isObjectId } from '../src/is';

describe('Invalid MongoDB Objects', () => {
  it('should return false for numeric values', () => {
    // eslint-disable-next-line @typescript-eslint/no-loss-of-precision
    const result = isObjectId(123456789012345678901234);
    expect(result).to.be.false;
  });

  it('should return false for random string values', () => {
    const result = isObjectId('qwertyuiopasdfghjklzxcvb');
    expect(result).to.be.false;
  });
});

describe('Valid MongoDB Objects', () => {
  it('should return true for _id of a MongoDB document', () => {
    const newId = new mongoose.mongo.ObjectId();
    const result = isObjectId(newId);
    expect(result).to.be.true;
  });

  it('should return true for _id string of a MongoDB document', () => {
    const newId = new mongoose.mongo.ObjectId();
    const result = isObjectId(String(newId));
    expect(result).to.be.true;
  });
});
