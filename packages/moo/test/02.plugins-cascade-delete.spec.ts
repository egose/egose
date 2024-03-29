import 'mocha';

import mongoose, { Model, Document } from 'mongoose';
import { expect } from 'chai';
import './00.setup.spec';
import { cascadeDeletePlugin } from '../src/plugins';
import { parseSemver } from '../../_common/utils/semver';
const semver = parseSemver(mongoose.version);
const deleteOneSupported = semver.major >= 7;
console.log('semver', semver);

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
  findDependents(modelName?: string): Promise<Record<string, Document[]> | Document[]>;
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

interface FileModel extends Model<IFile, {}, IFileMethods> {
  findOrphans(modelName?: string): Promise<Record<string, Document[]> | Document[]>;
}

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

fileSchema.plugin(cascadeDeletePlugin, {
  model: 'Tag',
  localField: '_id',
  foreignField: 'file',
  extraForeignFilter: {
    content: { $eq: 'to-delete' },
  },
});

const Reference = mongoose.model<IReference>('Reference', referenceSchema);
const Item = mongoose.model<IItem>('Item', itemSchema);
const Price = mongoose.model<IPrice>('Price', priceSchema);
const Note = mongoose.model<INote>('Note', noteSchema);
const File = mongoose.model<IFile, FileModel>('File', fileSchema);

interface ITag {
  file: string;
  content: string;
}

const tagSchema = new mongoose.Schema({
  file: { type: 'ObjectId', ref: 'File', required: true },
  content: { type: String, required: true },
});

const Tag = mongoose.model<ITag>('Tag', tagSchema);

describe('Cascade Delete Plugin', () => {
  it('should create refs and items under a file', async () => {
    const refs = await Reference.create([{ name: 'ref1' }, { name: 'ref2' }]);
    const items = await Item.create([{ name: 'item1' }, { name: 'item2' }]);
    const file = await File.create({ name: 'file1', refs, items });
    const tags = await Tag.create([
      { file: file._id, content: 'to-delete' },
      { file: file._id, content: 'to-delete' },
    ]);

    expect(file.name).equal('file1');
    expect(file.refs.length).equal(2);
    expect(file.items.length).equal(2);
    expect(tags.length).equal(2);
  });

  it('should delete refs when a file deleted', async () => {
    const file = await File.findOne({ name: 'file1' });

    // @ts-ignore
    deleteOneSupported ? await file.deleteOne() : await file.remove();

    const refs = await Reference.find();
    const items = await Item.find();
    const tags = await Tag.find();

    expect(refs.length).equal(0);
    expect(items.length).equal(2);
    expect(tags.length).equal(0);
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

    // @ts-ignore
    deleteOneSupported ? await file2.deleteOne() : await file2.remove();

    const _prices = await Price.find();
    expect(_prices.length).equal(2);
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

    // @ts-ignore
    deleteOneSupported ? await file3.deleteOne() : await file3.remove();

    const _notes = await Note.find();
    expect(_notes.length).equal(3);
  });

  it('should identify active dependants of a document', async () => {
    const refs = await Reference.create([{ name: 'ref1' }, { name: 'ref2' }]);

    const prices = await Price.create([
      { amount: 10 },
      { amount: 20 },
      { amount: 50 },
      { amount: 100 },
      { amount: 200 },
    ]);

    await Note.deleteMany({});
    const notes = await Note.create([
      { content: 'not-to-delete' },
      { content: 'not-to-delete' },
      { content: 'not-to-delete' },
      { content: 'to-delete' },
      { content: 'to-delete' },
      { content: 'to-delete' },
    ]);

    const file4 = await File.create({ name: 'file4', refs, prices, notes });
    const dependants = (await file4.findDependents()) as Record<string, Document[]>;

    expect(dependants.Reference.length).equal(2);
    expect(dependants.Price.length).equal(3);
    expect(dependants.Note.length).equal(3);
  });

  it('should identify active dependants of a document for a single model', async () => {
    const refs = await Reference.create([{ name: 'ref1' }, { name: 'ref2' }]);

    const prices = await Price.create([
      { amount: 10 },
      { amount: 20 },
      { amount: 50 },
      { amount: 100 },
      { amount: 200 },
    ]);

    await Note.deleteMany({});
    const notes = await Note.create([
      { content: 'not-to-delete' },
      { content: 'not-to-delete' },
      { content: 'not-to-delete' },
      { content: 'to-delete' },
      { content: 'to-delete' },
      { content: 'to-delete' },
    ]);

    const file5 = await File.create({ name: 'file5', refs, prices, notes });
    const noteDependants = await file5.findDependents('Note');

    expect(noteDependants.length).equal(3);
  });

  it('should identify unresolved dependants of a model', async () => {
    const file6 = await new File({ name: 'file6' });

    await Tag.deleteMany({});
    await Tag.create([
      { file: file6._id, content: 'to-delete' },
      { file: file6._id, content: 'to-delete' },
    ]);

    const orphans = (await File.findOrphans()) as Record<string, Document[]>;

    expect(orphans.Tag.length).equal(2);
  });

  it('should identify unresolved dependants of a model for a single model', async () => {
    const file7 = await new File({ name: 'file7' });

    await Tag.deleteMany({});
    await Tag.create([
      { file: file7._id, content: 'not-to-delete' },
      { file: file7._id, content: 'not-to-delete' },
      { file: file7._id, content: 'to-delete' },
      { file: file7._id, content: 'to-delete' },
    ]);

    const orphans = await File.findOrphans('Tag');

    expect(orphans.length).equal(2);
  });
});
