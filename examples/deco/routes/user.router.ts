import {
  Router,
  Prepare,
  DocPermissions,
  BaseQuery,
  Decorate,
  RouteGuard,
  Request,
  Document,
  Permissions,
  Context,
  Option,
} from '@egose/deco';

@Router('User')
export class UserRouter {
  @Option() routeGuard = {
    list: true,
    read: true,
    update: true,
    delete: 'isAdmin',
    create: ['isAdmin', 'dummy'],
    subs: {
      statusHistory: { list: true, read: true, update: true, delete: 'isAdmin', create: 'isAdmin' },
    },
  };

  @Option() permissionSchema = {
    name: { list: true, read: true, update: ['edit.name', 'edit.dummy'], create: true },
    role: { list: 'isAdmin', read: true, update: 'edit.role', create: 'isAdmin' },
    public: { list: false, read: true, update: 'edit.public', create: true },
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
    orgs: { list: true, read: true, update: 'edit.orgs', create: true },
  };

  @Option() baseUrl = null;

  @Option() identifier = (id) => {
    return { name: id };
  };

  @Option('baseQuery.subs') baseQuerySubs = {
    statusHistory: {
      list: (permissions) => {
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
  };

  @DocPermissions('default')
  docPermissions(@Request() req, @Document() doc, @Permissions() permissions) {
    const isMe = String(doc._id) === String(req._user?._id);
    const p = {
      'edit.name': permissions.isAdmin || isMe,
      'edit.role': permissions.isAdmin,
      'edit.public': permissions.isAdmin,
      'edit.statusHistory': permissions.isAdmin,
      'edit.orgs': permissions.isAdmin,
      'test:public': doc.public,
    };

    return p;
  }

  @BaseQuery('list')
  listBaseQuery(@Request() req, @Permissions() permissions) {
    if (permissions.isAdmin) return {};
    else return { $or: [{ _id: req._user?._id }, { public: true }] };
  }

  @BaseQuery('read')
  readBaseQuery(@Request() req, @Permissions() permissions) {
    if (permissions.isAdmin) return {};
    else return { _id: req._user?._id };
  }

  @BaseQuery('update')
  updateBaseQuery(@Request() req, @Permissions() permissions) {
    if (permissions.isAdmin) return {};
    else return { _id: req._user?._id };
  }

  @BaseQuery('delete')
  deleteBaseQuery(@Request() req, @Permissions() permissions) {
    if (permissions.isAdmin) return {};
    else return { _id: req._user?._id };
  }

  @Decorate('create')
  addCreatedBy(@Document() doc) {
    doc._createdBy = 'egose';
    return doc;
  }
}
