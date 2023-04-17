`List` operation executes hook methods in the following sequence:

<table>
  <tr>
    <th>Hook</th>
    <th>Parameters</th>
    <th>Description</th>
  </tr>
  <tr>
    <td><code>docPermissions</code></td>
    <td>
      <ol>
        <li>Mongoose document / plain document object</li>
        <li>global permissions</li>
      </ol>
    </td>
    <td>
      <ul>
        <li>skips if option <code>includePermissions</code> set to <code>false</code></li>
        <li>called after Mongoose execute the query</li>
        <li>runs on each document</li>
      </ul>
    </td>
  </tr>
  <tr>
    <td><code>decorate</code></td>
    <td>
      <ol>
        <li>plain document object</li>
        <li>global permissions</li>
      </ol>
    </td>
    <td>
      <ul>
        <li>runs on each document object</li>
      </ul>
    </td>
  </tr>
  <tr>
    <td><code>decorateAll</code></td>
    <td>
      <ol>
        <li>plain document objects</li>
        <li>global permissions</li>
      </ol>
    </td>
    <td>
      <ul>
        <li>runs on set of document objects</li>
      </ul>
    </td>
  </tr>
</table>

### Configuration Example

```ts
modelRouter.docPermissions('list', function (docOrObject, globalPermissions) {
  const isMe = String(docOrObject._id) === String(this.user._id);

  return {
    canEdit: globalPermissions.isAdmin || isMe,
  };
});

modelRouter.decorate('list', function (docObject, globalPermissions) {
  docObject.decoratedBy = 'egose';
  return docObject;
});

modelRouter.decorateAll(function (docObjects, globalPermissions) {
  const filtered = docObjects.filter((doc) => doc.public);
  return filtered;
});
```
