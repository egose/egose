import 'mocha';

import mongoose, { Model, Document, Types } from 'mongoose';
import { expect } from 'chai';
import './00.setup.spec';
import { cascadeDeletePlugin } from '../src/plugins';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

interface IReference {
  name: string;
}

interface IItem {
  name: string;
}

interface IFile {
  name: string;
  refs: string[];
  items: string[];
}

const referenceSchema = new mongoose.Schema({
  name: { type: String, required: true },
});

const itemSchema = new mongoose.Schema({
  name: { type: String, required: true },
});

const fileSchema = new mongoose.Schema({
  name: { type: String, required: true },
  refs: { type: [{ type: 'ObjectId', ref: 'Reference' }], default: [] },
  items: { type: [{ type: 'ObjectId', ref: 'Item' }], default: [] },
});

fileSchema.plugin(cascadeDeletePlugin, {
  model: 'Reference',
  localField: 'refs',
  foreignField: '_id',
});

const Reference = mongoose.model<IReference>('Reference', referenceSchema);
const Item = mongoose.model<IItem>('Item', itemSchema);
const File = mongoose.model<IFile>('File', fileSchema);

describe('Cascade Delete Plugin', () => {
  it('should create refs and items under a file', async () => {
    const refs = await Reference.create([{ name: 'ref1' }, { name: 'ref2' }]);
    const items = await Item.create([{ name: 'item1' }, { name: 'item2' }]);
    const file = await File.create({ name: 'file1', refs, items });

    expect(file.name).equal('file1');
    expect(file.refs.length).equal(2);
    expect(file.items.length).equal(2);
  });

  it('should delete refs when a file deleted', async () => {
    const file = await File.findOne({ name: 'file1' });

    if ('deleteOne' in file) {
      await file.deleteOne();

      const refs = await Reference.find();
      const items = await Item.find();

      expect(refs.length).equal(0);
      expect(items.length).equal(2);
    }
  });
});
