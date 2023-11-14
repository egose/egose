import mongoose from 'mongoose';
import { expect } from 'chai';
import 'mocha';

import { adapter, services } from './00.setup.spec';

describe('Sub-Document User', () => {
  it('should return allowed fields for status history list route', async () => {
    const response = await services.userService
      .id('lucy2')
      .subs('statusHistory')
      .list({ headers: { user: 'admin' } });

    expect(response.status).to.equal(200);
    expect(response.success).to.equal(true);

    expect(response.raw.length).to.equal(2);
    expect(response.raw[0].name).exist;
    expect(response.raw[0].approved).exist;
    expect(response.raw[0].document).not.exist;
  });

  it('should return expected fields for status history list advanced route', async () => {
    const response = await services.userService
      .id('lucy2')
      .subs('statusHistory')
      .listAdvanced({ approved: true }, { select: ['name'] }, { headers: { user: 'lucy2' } });

    expect(response.status).to.equal(200);
    expect(response.success).to.equal(true);

    expect(response.raw.length).to.equal(1);
    expect(response.raw[0].name).exist;
    expect(response.raw[0].approved).not.exist;
    expect(response.raw[0].document).not.exist;
  });

  it('should return allowed fields for status history read route', async () => {
    const lucy2: any = await mongoose.model('User').findOne({ name: 'lucy2' }).select('statusHistory');
    const subId = String(lucy2.statusHistory[0]._id);

    const response = await services.userService
      .id('lucy2')
      .subs('statusHistory')
      .read(subId, { headers: { user: 'admin' } });

    expect(response.status).to.equal(200);
    expect(response.success).to.equal(true);

    expect(response.raw._id).to.equal(subId);
    expect(response.raw.name).exist;
    expect(response.raw.approved).exist;
    expect(response.raw.document).to.be.a('string');
  });

  it('should return expected fields for status history read advanced route', async () => {
    const lucy2: any = await mongoose.model('User').findOne({ name: 'lucy2' }).select('statusHistory');
    const subId = String(lucy2.statusHistory[0]._id);

    const response = await services.userService
      .id('lucy2')
      .subs('statusHistory')
      .readAdvanced(subId, { select: ['name'] }, { headers: { user: 'admin' } });

    expect(response.status).to.equal(200);
    expect(response.success).to.equal(true);

    expect(response.raw._id).to.equal(subId);
    expect(response.raw.name).exist;
    expect(response.raw.approved).not.exist;
    expect(response.raw.document).not.exist;
  });

  it('should return updated fields for status history update route', async () => {
    let lucy2: any = await mongoose.model('User').findOne({ name: 'lucy2' }).select('statusHistory');
    let firstStatus = lucy2.statusHistory[0];
    let subId = String(firstStatus._id);

    const newName = firstStatus.name + '2';
    const oldApproved = firstStatus.approved;

    const response = await services.userService
      .id('lucy2')
      .subs('statusHistory')
      .update(subId, { name: newName, approved: !firstStatus.approved }, null, { headers: { user: 'admin' } });

    expect(response.status).to.equal(200);
    expect(response.success).to.equal(true);

    expect(response.raw._id).to.equal(subId);
    expect(response.raw.name).to.equal(newName);
    expect(response.raw.approved).to.equal(oldApproved);

    lucy2 = await mongoose.model('User').findOne({ name: 'lucy2' }).select('statusHistory');
    firstStatus = lucy2.statusHistory[0];

    expect(firstStatus.name).to.equal(newName);
    expect(firstStatus.approved).to.equal(oldApproved);
  });

  it('should return updated fields for multiple status history', async () => {
    let lucy2 = await mongoose.model('User').findOne({ name: 'lucy2' }).select('statusHistory');

    const updates = lucy2.statusHistory.map((status) => {
      return {
        original: status,
        new: {
          _id: status._id,
          name: status.name + '2',
          approved: !status.approved,
        },
      };
    });

    const response = await services.userService
      .id('lucy2')
      .subs('statusHistory')
      .bulkUpdate(
        updates.map((v) => v.new),
        null,
        { headers: { user: 'admin' } },
      );

    expect(response.status).to.equal(200);
    expect(response.success).to.equal(true);
    expect(response.raw.length).to.equal(updates.length);

    for (let x = 0; x < response.raw.length; x++) {
      const item = response.raw[x];
      expect(item._id).to.equal(String(updates[x].new._id));
      expect(item.name).to.equal(updates[x].new.name);
      expect(item.approved).to.equal(updates[x].original.approved);
    }
  });

  it('should add a new status through status history create route', async () => {
    const lucy2: any = await mongoose.model('User').findOne({ name: 'lucy2' }).select('statusHistory');
    const count = lucy2.statusHistory.length;

    const response = await services.userService
      .id('lucy2')
      .subs('statusHistory')
      .create({ name: 'manager', approved: true }, { headers: { user: 'admin' } });

    expect(response.status).to.equal(201);
    expect(response.success).to.equal(true);

    expect(response.raw.length).to.equal(count + 1);
    expect(response.raw[count].name).to.equal('manager');
    expect(response.raw[count].approved).to.equal(true);
  });

  it('should delete a status through status history delete route', async () => {
    let lucy2: any = await mongoose.model('User').findOne({ name: 'lucy2' }).select('statusHistory');
    const initialCount = lucy2.statusHistory.length;
    let secondStatus = lucy2.statusHistory[1];
    let subId = String(secondStatus._id);

    const response = await services.userService
      .id('lucy2')
      .subs('statusHistory')
      .delete(subId, { headers: { user: 'admin' } });

    expect(response.status).to.equal(200);
    expect(response.success).to.equal(true);

    expect(response.raw).to.equal(subId);

    lucy2 = await mongoose.model('User').findOne({ name: 'lucy2' }).select('statusHistory');
    expect(lucy2.statusHistory.length).to.equal(initialCount - 1);
  });

  it('should return unpopulated document field for status history read advanced route', async () => {
    const lucy2: any = await mongoose.model('User').findOne({ name: 'lucy2' }).select('statusHistory');
    const subId = String(lucy2.statusHistory[0]._id);

    const response = await services.userService
      .id('lucy2')
      .subs('statusHistory')
      .readAdvanced(subId, { select: ['document'] }, { headers: { user: 'admin' } });

    expect(response.status).to.equal(200);
    expect(response.success).to.equal(true);

    expect(response.raw._id).to.equal(subId);
    expect(response.raw.document).to.be.a('string');
  });

  it('should return populated document field for status history read advanced route', async () => {
    const lucy2: any = await mongoose.model('User').findOne({ name: 'lucy2' }).select('statusHistory');
    const subId = String(lucy2.statusHistory[0]._id);
    const documentId = String(lucy2.statusHistory[0].document);

    const response = await services.userService
      .id('lucy2')
      .subs('statusHistory')
      .readAdvanced(subId, { select: ['document'], populate: ['document'] }, { headers: { user: 'admin' } });

    expect(response.status).to.equal(200);
    expect(response.success).to.equal(true);

    expect(response.raw._id).to.equal(subId);
    expect(response.raw.document._id).to.equal(documentId);
  });
});
