## Middleware functions for Model Routers

Middleware functions, also known as hooks, are functions that execute during the lifecycle of asynchronous data model CRUD operations. These functions have the capability to intercept and modify requests and responses as they move through the application, offering developers a powerful means of adding custom logic, such as validation and data transformation, without altering the core application logic.

Middleware functions are also part of the model router's options and the way to define them is also the same.

Please note that if you want to access the `Express Request Object` inside your middleware functions, you should use `regular functions` instead of `arrow functions`. Arrow functions do not have their own `this` value, so you cannot reference the `this` keyword to access the `Request Object`.

### validate

The `validate` hooks enables you to apply custom logic to validate the data that comes from the requester before it is consumed by the further lifecycle middleware functions. With this option, you can define a set of rules or conditions that must be satisfied before the data is processed, helping to ensure the accuracy and integrity of your data.

Using validate, you can perform a wide range of checks and validations, such as data type validation, format validation, and business rule validation.

The `validate` hooks are available in both `create` and `update` operations and can be defined as individual hooks or as an object with separate functions for create and update.

```ts
import egose from '@egose/acl';

const create = function (dataObject, globalPermissions) {
  const hasName = !!dataObject.name;
  return hasName;
};

const update = function (dataObject, globalPermissions) {
  return true;
};

const validate = {
  create,
  update,
};

const userRouter = egose.createRouter('User', { validate });

// or

userRouter.validate(validate);

// or

userRouter.set('validate', validate);

// or

userRouter.validate('create', create);
userRouter.validate('update', update);

// or

userRouter.set('validate.create', create);
userRouter.set('validate.update', update);
```

### prepare

The `prepare` hooks enables you to apply custom logic to modify the data that comes from the requester before it is merged into the current document. With this option, you can update or add additional data fields, manipulate the data format or structure, or perform other types of data transformation.

Using `prepare`, you can perform a wide range of data processing and transformation tasks, such as data validation, data normalization, data enrichment, or data mapping. This feature can be especially useful in scenarios where you need to ensure the consistency and quality of your data.

The `prepare` hooks are available in both `create` and `update` operations and can be defined as individual hooks or as an object with separate functions for create and update.

```ts
import egose from '@egose/acl';

const create = function (dataObject, globalPermissions) {
  dataObject.createdBy = this.user._id;
  return dataObject;
};

const update = function (dataObject, globalPermissions) {
  dataObject.name = dataObject.name.trim();
  return dataObject;
};

const prepare = {
  create,
  update,
};

const userRouter = egose.createRouter('User', { prepare });

// or

userRouter.prepare(prepare);

// or

userRouter.set('prepare', prepare);

// or

userRouter.prepare('create', create);
userRouter.prepare('update', update);

// or

userRouter.set('prepare.create', create);
userRouter.set('prepare.update', update);
```

### transform

The `transform` hook allows you to apply process logic to modify the Mongoose document after the raw data has been merged into the current document. This hook is particularly useful for finalizing the updated document before the changes are saved in the database.

The `transform` hook is only available for the update operation.

```ts
import egose from '@egose/acl';

const transform = function (doc, globalPermissions) {
  doc.updateAuditFields(this.user);
  return doc;
};

const userRouter = egose.createRouter('User', { transform });

// or

userRouter.transform(transform);

// or

userRouter.set('transform', transform);
```

### decorate

The `decorate` hooks are invoked prior to sending the response data to the requester. They are utilized for processing raw data and applying custom logic before returning the result.

The `decorate` hook are available in `list`, `read`, `create`, and `update` operations and can be defined as individual hooks or as an object with separate functions.

```ts
import egose from '@egose/acl';

const list = function (dataObject, globalPermissions) {
  dataObject._context = 'list';
  return dataObject;
};

const read = function (dataObject, globalPermissions) {
  dataObject._context = 'read';
  return dataObject;
};

const create = function (dataObject, globalPermissions) {
  dataObject._context = 'create';
  return dataObject;
};

const update = function (dataObject, globalPermissions) {
  dataObject._context = 'update';
  return dataObject;
};

const decorate = {
  list,
  read,
  create,
  update,
};

const userRouter = egose.createRouter('User', { decorate });

// or

userRouter.decorate(decorate);

// or

userRouter.set('decorate', decorate);

// or

userRouter.decorate('list', list);
userRouter.decorate('read', read);
userRouter.decorate('create', create);
userRouter.decorate('update', update);

// or

userRouter.set('decorate', decorate);
userRouter.set('decorate.list', list);
userRouter.set('decorate.read', read);
userRouter.set('decorate.create', create);
userRouter.set('decorate.update', update);
```

### decorateAll

The `decorateAll` hook is invoked prior to sending the response data in the `list` operation. It is used for processing and filtering multiple document objects before returning the result. It's important to note that the `decorateAll` hook runs after the `decorate` middleware has executed.

The `decorateAll` hook is only available for the `update` operation.

```ts
import egose from '@egose/acl';

const decorateAll = function (docObjects, globalPermissions) {
  return omitInvalidDocs(docObjects);
};

const userRouter = egose.createRouter('User', { decorateAll });

// or

userRouter.decorateAll(decorateAll);

// or

userRouter.set('decorateAll', decorateAll);
```

## Availability in CRUD Operations

Each middleware function is available in the following CRUD operations:

| Middleware   | List | Read | Create | Update | Delete |
| ------------ | ---- | ---- | ------ | ------ | ------ |
| Validate     |      |      | ✓      | ✓      |        |
| Prepare      |      |      | ✓      | ✓      |        |
| Transform    |      |      |        | ✓      |        |
| Decorate     | ✓    | ✓    | ✓      | ✓      |        |
| Decorate All | ✓    |      |        |        |        |
