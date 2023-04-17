import {
  // class decorator
  Router,
  // method decorators
  DocPermissions,
  BaseFilter,
  Validate,
  Prepare,
  Transform,
  Decorate,
  DecorateAll,
  RouteGuard,
  // parameter decorators
  Request,
  Document,
  Permissions,
  Context,
  // property decorator
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
      statusHistory: {
        list: true,
        read: true,
        update: true,
        delete: 'isAdmin',
        create: 'isAdmin',
      },
    },
  };

  @Option() permissionSchema = {
    name: {
      list: true,
      read: true,
      update: ['edit.name', 'edit.dummy'],
      create: true,
    },
    role: {
      list: 'isAdmin',
      read: true,
      update: 'edit.role',
      create: 'isAdmin',
    },
    public: {
      list: false,
      read: true,
      update: 'edit.public',
      create: true,
    },
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

  @Option('baseFilter.subs') baseFilterSubs = {
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

  @BaseFilter('list')
  listBaseFilter(@Request() req, @Permissions() permissions) {
    if (permissions.isAdmin) return {};
    else return { $or: [{ _id: req._user?._id }, { public: true }] };
  }

  @BaseFilter('read')
  readBaseFilter(@Request() req, @Permissions() permissions) {
    if (permissions.isAdmin) return {};
    else return { _id: req._user?._id };
  }

  @BaseFilter('update')
  updateBaseFilter(@Request() req, @Permissions() permissions) {
    if (permissions.isAdmin) return {};
    else return { _id: req._user?._id };
  }

  @BaseFilter('delete')
  deleteBaseFilter(@Request() req, @Permissions() permissions) {
    if (permissions.isAdmin) return {};
    else return { _id: req._user?._id };
  }

  @Decorate('create')
  addCreatedBy(@Document() doc) {
    doc._createdBy = 'egose';
    return doc;
  }
}
