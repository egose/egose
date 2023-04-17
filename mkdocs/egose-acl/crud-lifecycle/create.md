`Create` operation executes hook methods in the following sequence:

<table>
  <tr>
    <th>Hook</th>
    <th>Parameters</th>
    <th>Description</th>
  </tr>
  <tr>
    <td><code>validate</code></td>
    <td>
      <ol>
        <li>allowed data object</li>
        <li>global permissions</li>
        <li>context object:<ul><li>originalData</li></ul></li>
      </ol>
    </td>
    <td>
      <ul></ul>
    </td>
  </tr>
  <tr>
    <td><code>prepare</code></td>
    <td>
      <ol>
        <li>allowed data object</li>
        <li>global permissions</li>
        <li>context object:<ul><li>originalData</li></ul></li>
      </ol>
    </td>
    <td>
      <ul></ul>
    </td>
  </tr>
  <tr>
    <td><code>docPermissions</code></td>
    <td>
      <ol>
        <li>Mongoose document</li>
        <li>global permissions</li>
        <li>context object:<ul><li>originalData</li><li>preparedData</li></ul></li>
      </ol>
    </td>
    <td>
      <ul>
        <li>skips if option <code>includePermissions</code> set to <code>false</code></li>
        <li>called after a Mongoose document created</li>
      </ul>
    </td>
  </tr>
  <tr>
    <td><code>decorate</code></td>
    <td>
      <ol>
        <li>plain document object</li>
        <li>global permissions</li>
        <li>context object:<ul><li>originalData</li><li>preparedData</li></ul></li>
      </ol>
    </td>
    <td>
      <ul>
      </ul>
    </td>
  </tr>
</table>

### Configuration Example

```ts
modelRouter.validate('create', function (dataObject, globalPermissions) {
  const hasName = !!dataObject.name;
  return hasName;
});

modelRouter.prepare('create', function (dataObject, globalPermissions) {
  dataObject.name = dataObject.name.trim();
  return dataObject;
});

modelRouter.docPermissions('create', function (doc, globalPermissions) {
  const isMe = String(doc._id) === String(this.user._id);

  return {
    'edit.name': globalPermissions.isAdmin || isMe,
    'edit.role': globalPermissions.isAdmin,
  };
});

modelRouter.decorate('create', function (docObject, globalPermissions) {
  docObject.decoratedBy = 'egose';
  return docObject;
});
```
