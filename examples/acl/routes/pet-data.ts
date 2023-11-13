import egose from '@egose/acl';
import { Permissions } from '@egose/acl';

export const petRouter = egose.createDataRouter('Pet', {
  basePath: null,
  parentPath: '/api',
});

petRouter
  .data([
    {
      name: 'Max',
      age: 1,
      sex: 'male',
      public: true,
    },
    {
      name: 'Bella',
      age: 3,
      sex: 'female',
      public: true,
    },
    {
      name: 'Rocky',
      age: 5,
      sex: 'male',
      public: false,
    },
    {
      name: 'Buddy',
      age: 1,
      sex: 'male',
      public: true,
    },
    {
      name: 'Milo',
      age: 4,
      sex: 'male',
      public: false,
    },
    {
      name: 'Toby',
      age: 1,
      sex: 'male',
      public: true,
    },
    {
      name: 'Zoey',
      age: 2,
      sex: 'female',
      public: false,
    },
  ])
  .permissionSchema({
    name: { list: true, read: true },
    age: { list: 'isAdmin', read: true },
    sex: { list: false, read: true },
  })
  .baseFilter({
    list: function (permissions: Permissions) {
      if (permissions.isAdmin) return {};
      return { public: true };
    },
    read: function (permissions) {
      if (permissions.isAdmin) return {};
      return { public: true };
    },
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
  })
  .identifier(function (id) {
    return { name: id };
  });

export default petRouter;
