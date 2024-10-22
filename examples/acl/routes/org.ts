import egose, { Permissions } from '@egose/acl';

export const orgRouter = egose.createRouter('Org', {
  basePath: null,
  queryPath: '_extra',
  parentPath: '/api',
  modelPermissionPrefix: 'm::',
});

orgRouter
  .permissionSchema({ name: { list: true, read: true, update: true, create: true } })
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
      if (!this._user) return false;
      if (permissions.isAdmin) return {};
      else return { _id: this._user.orgs };
    },
    update: function (permissions: Permissions) {
      if (!this._user) return false;
      if (permissions.isAdmin) return {};
      else return { _id: this._user.orgs };
    },
    delete: function (permissions: Permissions) {
      if (!this._user) return false;
      if (permissions.isAdmin) return {};
      else return { _id: this._user.orgs };
    },
  })
  .overrideFilter('list', function (filter: any, permissions: Permissions) {
    return filter;
  })
  .routeGuard({
    list: true,
    read: true,
    update: true,
    upsert: true,
    delete: false,
    create: 'isAdmin',
    count: true,
  });

orgRouter.router.post('/chairman', (req) => ({ name: 'chairman', flag: req.body.flag }));

egose.setModelOption('Location', 'permissionSchema', { name: { list: true, read: true, create: true } });

export default orgRouter;
