`Read` operation executes hook methods in the following sequence:

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
</table>

### Configuration Example

```ts
modelRouter.docPermissions('read', function (docOrObject, globalPermissions) {
  const isMe = String(docOrObject._id) === String(this.user._id);

  return {
    'edit.name': globalPermissions.isAdmin || isMe,
    'edit.role': globalPermissions.isAdmin,
  };
});

modelRouter.decorate('read', function (docObject, globalPermissions) {
  docObject.timestamp = new Date();
  return docObject;
});
```
