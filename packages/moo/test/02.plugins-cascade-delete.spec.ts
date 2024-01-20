import 'mocha';

import mongoose, { Model, Document } from 'mongoose';
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

interface IPrice {
  amount: number;
}

interface INote {
  content: string;
}

interface IFile {
  name: string;
  refs: string[];
  items: string[];
  prices: string[];
  notes: string[];
}

interface IFileMethods {
  findDependents(): Record<string, Document[]>;
}

const referenceSchema = new mongoose.Schema({
  name: { type: String, required: true },
});

const itemSchema = new mongoose.Schema({
  name: { type: String, required: true },
});

const priceSchema = new mongoose.Schema({
  amount: { type: Number, required: true },
});

const noteSchema = new mongoose.Schema({
  content: { type: String, required: true },
});

type FileModel = Model<IFile, {}, IFileMethods>;

const fileSchema = new mongoose.Schema<IFile, FileModel, IFileMethods>({
  name: { type: String, required: true },
  // @ts-ignore
  refs: { type: [{ type: 'ObjectId', ref: 'Reference' }], default: [] },
  // @ts-ignore
  items: { type: [{ type: 'ObjectId', ref: 'Item' }], default: [] },
  // @ts-ignore
  prices: { type: [{ type: 'ObjectId', ref: 'Price' }], default: [] },
  // @ts-ignore
  notes: { type: [{ type: 'ObjectId', ref: 'Note' }], default: [] },
});

fileSchema.plugin(cascadeDeletePlugin, {
  model: 'Reference',
  localField: 'refs',
  foreignField: '_id',
});

fileSchema.plugin(cascadeDeletePlugin, {
  model: 'Price',
  localField: 'prices',
  foreignField: '_id',
  extraForeignFilter: {
    amount: { $lt: 100 },
  },
});

fileSchema.plugin(cascadeDeletePlugin, {
  model: 'Note',
  foreignFilter: {
    content: { $eq: 'to-delete' },
  },
});

const Reference = mongoose.model<IReference>('Reference', referenceSchema);
const Item = mongoose.model<IItem>('Item', itemSchema);
const Price = mongoose.model<IPrice>('Price', priceSchema);
const Note = mongoose.model<INote>('Note', noteSchema);
const File = mongoose.model<IFile, FileModel>('File', fileSchema);

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

  it('should delete prices that matches the extra filter only when a file deleted', async () => {
    const prices = await Price.create([
      { amount: 10 },
      { amount: 20 },
      { amount: 50 },
      { amount: 100 },
      { amount: 200 },
    ]);
    const file2 = await File.create({ name: 'file2', prices });

    if ('deleteOne' in file2) {
      await file2.deleteOne();

      const prices = await Price.find();
      expect(prices.length).equal(2);
    }
  });

  it('should delete notes that matches the filter only when a file deleted', async () => {
    const notes = await Note.create([
      { content: 'not-to-delete' },
      { content: 'not-to-delete' },
      { content: 'not-to-delete' },
      { content: 'to-delete' },
      { content: 'to-delete' },
      { content: 'to-delete' },
    ]);
    const file3 = await File.create({ name: 'file3', notes });

    if ('deleteOne' in file3) {
      await file3.deleteOne();

      const notes = await Note.find();
      expect(notes.length).equal(3);
    }
  });

  it('should identify unresolved dependencies of a document', async () => {
    const refs = await Reference.create([{ name: 'ref1' }, { name: 'ref2' }]);

    const prices = await Price.create([
      { amount: 10 },
      { amount: 20 },
      { amount: 50 },
      { amount: 100 },
      { amount: 200 },
    ]);

    const notes = await Note.create([
      { content: 'not-to-delete' },
      { content: 'not-to-delete' },
      { content: 'not-to-delete' },
      { content: 'to-delete' },
      { content: 'to-delete' },
      { content: 'to-delete' },
    ]);

    const file4 = await File.create({ name: 'file4', refs, prices, notes });
    const orphans = await file4.findDependents();

    expect(orphans.Reference.length).equal(2);
    expect(orphans.Price.length).equal(3);
    expect(orphans.Note.length).equal(3);
  });
});
