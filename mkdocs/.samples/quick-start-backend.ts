import mongoose from 'mongoose';
import express from 'express';
import egose from '@egose/acl';

const app = express();
const router = express.Router();

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  role: { type: String, enum: ['admin', 'user'] },
  public: { type: Boolean, default: false },
});

mongoose.model('User', UserSchema);

egose.set('globalPermissions', function (req) {
  const user = req.user;

  if (!user) return { isGuest: true };

  return {
    isGuest: false,
    isUser: true,
    isAdmin: user.role === 'admin',
  };
});

const userRouter = egose.createRouter('User', { basePath: '/users' });

userRouter.routeGuard({
  list: true,
  read: ['isAdmin', 'isUser'],
  update: 'isAdmin',
  create: function (globalPermissions) {
    if (globalPermissions.isAdmin) return true;
    return false;
  },
  delete: false,
});

userRouter.baseFilter({
  list: function (globalPermissions) {
    return true;
  },
  read: function (globalPermissions) {
    if (globalPermissions.isAdmin) return {};
    else return { $or: [{ _id: this.user._id }, { public: true }] };
  },
  update: function (globalPermissions) {
    if (globalPermissions.isAdmin) return {};
    else return { _id: this.user._id };
  },
  delete: function (globalPermissions) {
    return globalPermissions.isAdmin;
  },
});

userRouter.docPermissions(function (docOrObject, globalPermissions) {
  const isMe = String(docOrObject._id) === String(this.user._id);

  return {
    'edit.name': globalPermissions.isAdmin || isMe,
    'edit.role': globalPermissions.isAdmin,
  };
});

userRouter.permissionSchema({
  name: { list: true, read: true, update: 'edit.name', create: true },
  role: {
    list: ['isAdmin', 'isUser'],
    read: 'isAdmin',
    update: function (globalPermissions, docPermissions) {
      if (docPermissions['edit.role']) return true;
      return false;
    },
    create: 'isAdmin',
  },
});

router.use('/', userRouter.routes);
app.use('/api', router);
app.listen(3000);
