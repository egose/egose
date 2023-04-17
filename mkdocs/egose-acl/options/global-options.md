## Global Options for Library and Model Routers

Global options define the library-level or default options for model routers.

### globalPermissions

Global permissions are based on the requester's authentication/authorization context and determine the requester's access level for each request. Here's an example usage:

```ts
import egose from '@egose/acl';

egose.set('globalPermissions', function (req) {
  const user = req.user;

  if (!user) return { isGuest: true };

  return {
    isGuest: false,
    isUser: true,
    isAdmin: user.role === 'admin',
  };
});
```

In the above example, the `globalPermissions` option sets different access levels for users based on their authentication context. If a user is not authenticated, their access level is set to `isGuest`. If the user is authenticated, their access level is set to `isUser`, and if they have an 'admin' role, their access level is also set to `isAdmin`.

### permissionField

This option specifies the name of the object field that is used to set the global permissions in the `Request Object`. By default, it is set to `_permissions`.

```ts
import egose from '@egose/acl';

egose.set('permissionField', '__access');
```

### idParam

This option specifies the default name of the `Route parameter` that is used to capture the document ID. It is used if the model option `idParam` is omitted. By default, it is set to `id`.

```ts
import egose from '@egose/acl';

egose.set('idParam', 'identifier');
```

### queryPath

This option specifies the default path name (suffix) for `Advanced View Routes`. It is used if the model option `queryPath` is not specified. By default, it is set to `__query`.

```ts
import egose from '@egose/acl';

egose.set('queryPath', '__q__');
```

### mutationPath

This option specifies the default path name (suffix) for `Advanced Write Routes`. It is used if the model option `mutationPath` is not specified. By default, it is set to `__mutation`.

```ts
import egose from '@egose/acl';

egose.set('mutationPath', '__m__');
```
