import macl, { Permissions } from '@egose/acl';

export const orgRouter = macl.createRouter('Org', {
  basePath: null,
  queryPath: '_extra',
  permissionSchema: { name: { list: true, read: true, create: true } },
  docPermissions: () => {
    return { read: false, edit: true };
  },
});

orgRouter.prepare(function (data) {
  return data;
});

orgRouter.baseFilter({
  list: function (permissions: Permissions) {
    return true;
  },
  read: function (permissions: Permissions) {
    if (permissions.isAdmin) return {};
    else return { _id: this._user.orgs };
  },
  update: function (permissions: Permissions) {
    if (permissions.isAdmin) return {};
    else return { _id: this._user.orgs };
  },
  delete: function (permissions: Permissions) {
    if (permissions.isAdmin) return {};
    else return { _id: this._user.orgs };
  },
});

orgRouter.routeGuard({
  list: true,
  read: true,
  update: true,
  delete: false,
  create: 'isAdmin',
});

export default orgRouter.routes;
