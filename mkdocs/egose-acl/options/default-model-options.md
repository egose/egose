## Options for Default Model Routers

The default model router options are applied to a router when a specific option is not provided. In these cases, the default options are used.

### permissionField

The `permissionField` option specifies the name of the object field that is used to set the model permissions in the Mongoose document or document object. By default, it is set to `_permissions`.

```ts
import egose from '@egose/acl';

const permissionField = '__access';

egose.setDefaultModelOption('permissionField', permissionField);

// or

egose.setDefaultModelOptions({ permissionField });
```

### idParam

The `idParam` option is used to specify the `Express Route Parameter` that is used to capture the `Document ID` value. This option is only applicable when creating the model router and is set to `id` by default.

```ts
import egose from '@egose/acl';

const idParam = 'doc_id';

egose.setDefaultModelOption('idParam', idParam);

// or

egose.setDefaultModelOptions({ idParam });
```

### identifier

The option `identifier` defines how `id param` is used to find the target document, defaults to `_id` field; there is more than one way to define the relation:

- `string`: Mongoose document field key
- `function`: Function returns a Mongoose query to find the target document.

```ts
import egose from '@egose/acl';

const identifier = function (id) {
  return { $or: [{ _id: id }, { code: id }] };
};

egose.setDefaultModelOption('identifier', identifier);

// or

egose.setDefaultModelOptions({ identifier });
```

### parentPath

The `parentPath` option is a configuration setting that allows you to specify the path name between the `host` and the `basePath` for each model router. This option is used to build the full path for each router. If no other value is provided, it defaults to `''`.

```ts
import egose from '@egose/acl';

const parentPath = '/api';

egose.setDefaultModelOption('parentPath', parentPath);

// or

egose.setDefaultModelOptions({ parentPath });
```

### queryPath

The `queryPath` option is used to set the path name (suffix) for `Advanced View Routes`. If no other value is provided, it defaults to `__query`.

```ts
import egose from '@egose/acl';

const queryPath = '__q__';

egose.setDefaultModelOption('queryPath', queryPath);

// or

egose.setDefaultModelOptions({ queryPath });
```

### mutationPath

The `mutationPath` option is used to set the path name (suffix) for `Advanced Write Routes`. If no other value is provided, it defaults to `__mutation`.

```ts
import egose from '@egose/acl';

const mutationPath = '__m__';

egose.setDefaultModelOption('mutationPath', mutationPath);

// or

egose.setDefaultModelOptions({ mutationPath });
```

### listHardLimit

The `listHardLimit` option specifies the maximum number of documents to return from a query. It is useful for limiting the amount of data that is retrieved from the database, which can improve performance and reduce the risk of overloading the server or client.

```ts
import egose from '@egose/acl';

const listHardLimit = 100;

egose.setDefaultModelOption('listHardLimit', listHardLimit);

// or

egose.setDefaultModelOptions({ listHardLimit });
```

If the `listHardLimit` option is set to `100` and a request is made with a limit parameter that exceeds `100`, the number of returned documents will be capped at `100`.

### routeGuard

The `routeGuard` option enables you to control access to the backend API endpoints based on the requester's global permissions. With this option, you can specify which routes are allowed and which ones are excluded, using the familiar CRUDL model (Create, Read, Update, Delete, and List).

By using `routeGuard`, you can ensure that only authorized users can access and modify your data, helping to protect the confidentiality and integrity of your information.

```ts
import egose from '@egose/acl';

const listDef = true;
const readDef = ['isAdmin', 'isUser'];
const updateDef = 'isAdmin';
const createDef = function (globalPermissions) {
  if (globalPermissions.isAdmin) return true;
  return false;
};
const deleteDef = false;

const routeGuard = {
  list: listDef,
  read: readDef,
  create: createDef,
  update: updateDef,
  delete: deleteDef,
};

egose.setDefaultModelOption('routeGuard', routeGuard);
egose.setDefaultModelOption('routeGuard.list', listDef);
egose.setDefaultModelOption('routeGuard.read', readDef);
egose.setDefaultModelOption('routeGuard.create', createDef);
egose.setDefaultModelOption('routeGuard.update', updateDef);
egose.setDefaultModelOption('routeGuard.delete', deleteDef);

// or

egose.setDefaultModelOptions({ routeGuard });
```
