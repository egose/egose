import 'mocha';

import mongoose from 'mongoose';
import { expect } from 'chai';
import './00.setup.spec';
import { uniqueNullableString } from '../src/schema';

interface IPerson {
  name: string;
  loc: string;
}

const personSchema = new mongoose.Schema({
  name: { type: String, unique: true },
  loc: uniqueNullableString('loc'),
});

const Person = mongoose.model<IPerson>('Person', personSchema);

describe('Schema Helpers', () => {
  it(`should throw duplicate key error on 'name' field with 'null'`, async () => {
    let errstr = '';
    try {
      await Person.create({ name: null, loc: 'london' });
      await Person.create({ name: null, loc: 'sydney' });
    } catch (err) {
      errstr = String(err);
    }

    expect(errstr).contains('E11000 duplicate key error collection');
    expect(errstr).contains('name_1 dup key');
  });

  it(`should not throw duplicate key error on 'loc' field with 'null'`, async () => {
    let errstr = '';
    try {
      await Person.create({ name: 'mark', loc: null });
      await Person.create({ name: 'james', loc: null });
    } catch (err) {
      errstr = String(err);
    }

    expect(errstr).to.equal('');
  });

  it(`should throw duplicate key error on 'loc' field with empty values`, async () => {
    let errstr = '';
    try {
      await Person.create({ name: 'jack', loc: '' });
      await Person.create({ name: 'lucas', loc: '' });
    } catch (err) {
      errstr = String(err);
    }

    expect(errstr).contains('E11000 duplicate key error collection');
    expect(errstr).contains('loc_1 dup key');
  });

  it(`should not throw duplicate key error on 'loc' field with different values`, async () => {
    let errstr = '';
    try {
      await Person.create({ name: 'william', loc: 'spain' });
      await Person.create({ name: 'emma', loc: 'mexico' });
    } catch (err) {
      errstr = String(err);
    }

    expect(errstr).to.equal('');
  });
});
