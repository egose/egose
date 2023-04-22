## Update Resource

This entrypoint updates a target resource.

- `PUT /{base_url}/:id`

### Parameters

| Name            | Type    | In    | Description                                           | Default |
| --------------- | ------- | ----- | ----------------------------------------------------- | ------- |
| `id`            | string  | param | Resource identifier; `required`                       |         |
| `returning_all` | boolean | query | Whether to return entire document or partial document | true    |

### Example

#### request

=== "cURL"

    ```bash
    curl \
      -X PUT \
      -H "Accept: application/json" \
      https://example.com/users/5d6ede6a0ba62570afcedd3b?returning_all=false \
      -d '{ "name": "Andrew-2nd" }'
    ```

=== "Javascript"

    ```js
    const targetId = '5d6ede6a0ba62570afcedd3b';

    const params = {
      returning_all: false,
    };

    const url = 'https://example.com/users/' + targetId + new URLSearchParams(params);

    const response = await fetch(url, {
      method: 'PUT',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
    });

    const result = response.json();
    ```

#### response

```
Status: 200
```

```json
{
  "name": "Andrew-2nd"
}
```

## Update Resource - Advanced

This entrypoint updates a target resource and returns selective data fields.

- `PUT /{base_url}/__mutation/:id`

### Parameters

| Name                         | Type                             | In    | Description                                                | Default |
| ---------------------------- | -------------------------------- | ----- | ---------------------------------------------------------- | ------- |
| `id`                         | string                           | param | Resource identifier; `required`                            |         |
| `returning_all`              | boolean                          | query | Whether to return entire document or partial document; 2nd | true    |
| `data`                       | object                           | body  | Document data to create                                    |         |
| `select`                     | object \| array<string\>         | body  | Document fields to include or exclude after the update     |         |
| `populate`                   | array<string\> \| array<object\> | body  | Document fields to populate after the update               |         |
| `options.returningAll`       | boolean                          | body  | Whether to return entire document or partial document; 1st | true    |
| `options.includePermissions` | boolean                          | body  | Whether to include document permissions                    | true    |
| `options.populateAccess`     | 'list' \| 'read'                 | body  | The access level to use in `populate` method               | read    |

### Example

#### request

=== "cURL"

    ```bash
    curl \
      -X PUT \
      -H "Accept: application/json" \
      https://example.com/users/5d6ede6a0ba62570afcedd3b \
      -d '{
        "data": { "name": "Andrew-2nd" },
        "select": ["name", "address"],
        "populate": ["address"],
        "options": {
          "includePermissions": true,
          "populateAccess": "read",
        }
      }'
    ```

=== "Javascript"

    ```js
    const targetId = '5d6ede6a0ba62570afcedd3b';

    const data = {
      data: { name: 'Andrew-2nd' },
      select: ['name', 'address'],
      populate: ['address'],
      options: {
        includePermissions: true,
        populateAccess: 'read',
      },
    };

    const url = 'https://example.com/users/__mutation/' + targetId;

    const response = await fetch(url, {
      method: 'PUT',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    const result = response.json();
    ```

#### response

```
Status: 200
```

```json
{
  "_id": "5d6ede6a0ba62570afcedd3b",
  "name": "Andrew-2nd",
  "address": {
    "city": "Seattle",
    "country": "USA"
  },
  "_permissions": {
    "edit": false
  }
}
```
