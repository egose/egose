import egose from '@egose/acl';
import { Permissions, guard } from '@egose/acl';
import JsonRouter from 'express-json-router';

export const userRouter = egose.createRouter('User', {
  basePath: null,
  parentPath: '/api',
  modelPermissionPrefix: 'm::',
});

userRouter
  .permissionSchema({
    name: { list: true, read: true, update: ['m::edit.name', 'm::edit.dummy'], create: true },
    role: { list: 'isAdmin', read: true, update: 'm::edit.role', create: 'isAdmin' },
    public: { list: false, read: true, update: 'm::edit.public', create: true },
    statusHistory: {
      list: (permissions) => {
        return false;
      },
      read: (permissions) => {
        return permissions.isAdmin;
      },
      update: (permissions, modelPermissions) => {
        return modelPermissions['edit.statusHistory'];
      },
      sub: {
        name: { list: true, read: true, update: true, create: true },
        approved: { list: true, read: true, update: false, create: true },
        document: { list: false, read: true, update: true, create: true },
      },
    },
    orgs: { list: true, read: true, update: 'm::edit.orgs', create: true },
  })
  .docPermissions(function (doc, permissions) {
    const isMe = String(doc._id) === String(this._user?._id);
    const p = {
      'edit.name': permissions.isAdmin || isMe,
      'edit.role': permissions.isAdmin,
      'edit.public': permissions.isAdmin,
      'edit.statusHistory': permissions.isAdmin,
      'edit.orgs': permissions.isAdmin,
      'test:public': doc.public,
    };

    return p;
  })
  .baseFilter({
    list: function (permissions: Permissions) {
      if (permissions.isAdmin) return {};
      else return { $or: [{ _id: this._user?._id }, { public: true }] };
    },
    read: function (permissions) {
      if (permissions.isAdmin) return {};
      else return { _id: this._user?._id };
    },
    update: function (permissions) {
      if (permissions.isAdmin) return {};
      else return { _id: this._user?._id };
    },
    delete: function (permissions) {
      if (permissions.isAdmin) return {};
      else return { _id: this._user?._id };
    },
    subs: {
      statusHistory: {
        list: (permissions: Permissions) => {
          if (permissions.isAdmin) return {};
          else return { approved: true };
        },
        read: (permissions) => {
          if (permissions.isAdmin) return {};
          else return { approved: true };
        },
        update: (permissions) => {
          if (permissions.isAdmin) return {};
          else return false;
        },
        delete: (permissions) => {
          if (permissions.isAdmin) return {};
          else return false;
        },
      },
    },
  })
  .finalize(function (doc) {
    return doc;
  })
  .change('name', function (oldVal, newVal, meta) {
    console.log(`name changed: ${oldVal} > ${newVal}: ${JSON.stringify(meta)}`);
  })
  .change('public', function (oldVal, newVal, meta) {
    console.log(`public changed: ${oldVal} > ${newVal}: ${JSON.stringify(meta)}`);
  })
  .decorate({
    default: [
      function (doc) {
        return doc;
      },
      function (doc) {
        return doc;
      },
    ],
    create: function (doc) {
      doc._createdBy = 'egose';
      return doc;
    },
  })
  .routeGuard({
    list: true,
    read: true,
    update: true,
    delete: 'isAdmin',
    create: ['isAdmin', 'dummy'],
    subs: {
      statusHistory: { list: true, read: true, update: true, delete: 'isAdmin', create: 'isAdmin' },
    },
  })
  .identifier(function (id) {
    return { name: id };
  });

userRouter.router.get(
  '/custom/query',
  guard({ modelName: 'User', id: { type: 'query', key: 'userid' }, condition: 'edit.role' }),
  () => {
    return true;
  },
);

userRouter.router.get(
  '/custom/:userid',
  guard({ modelName: 'User', id: { type: 'param', key: 'userid' }, condition: 'edit.role' }),
  () => {
    return true;
  },
);

export default userRouter;
