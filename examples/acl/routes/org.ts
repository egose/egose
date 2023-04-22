import egose, { Permissions } from '@egose/acl';

export const orgRouter = egose.createRouter('Org', {
  basePath: null,
  queryPath: '_extra',
  parentPath: '/api',
});

orgRouter
  .permissionSchema({ name: { list: true, read: true, create: true } })
  .docPermissions(() => {
    return { read: false, edit: true };
  })
  .prepare(function (data) {
    return data;
  })
  .baseFilter({
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
  })
  .routeGuard({
    list: true,
    read: true,
    update: true,
    delete: false,
    create: 'isAdmin',
  });

export default orgRouter;
