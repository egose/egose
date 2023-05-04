import mongoose from 'mongoose';
import { permissionsPlugin } from '@egose/acl';

const DocumentSchema = new mongoose.Schema({
  name: { type: String, required: true },
});

mongoose.model('Document', DocumentSchema);

const Status = new mongoose.Schema({
  name: { type: String, required: true },
  approved: { type: Boolean, default: false },
  document: { type: 'ObjectId', ref: 'Document', default: null },
});

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true, default: '' },
  role: { type: String, enum: ['admin', 'user'], default: 'user' },
  statusHistory: { type: [Status], default: [] },
  orgs: [{ type: 'ObjectId', ref: 'Org' }],
  public: { type: Boolean, default: false },
});

UserSchema.plugin(permissionsPlugin, { modelName: 'User' });

export default mongoose.model('User', UserSchema);
