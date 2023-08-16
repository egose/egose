## Read Resource

This entrypoint returns a target resource.

- `GET /{base_url}/:id`

### Parameters

| Name                  | Type    | In    | Description                                                | Default |
| --------------------- | ------- | ----- | ---------------------------------------------------------- | ------- |
| `id`                  | string  | param | Resource identifier; `required`                            |         |
| `include_permissions` | boolean | query | Whether to include document permissions                    | true    |
| `try_list`            | boolean | query | Whether to attempt to retrieve the resource if not allowed | true    |

### Example

#### request

=== "cURL"

    ```bash
    curl \
      -H "Accept: application/json" \
      https://example.com/users/5d6ede6a0ba62570afcedd3b?try_list=true&include_permissions=false
    ```

=== "Javascript"

    ```js
    const targetId = '5d6ede6a0ba62570afcedd3b';
    const params = {
      try_list: true,
      include_permissions: false
    };

    const url = 'https://example.com/users/' + targetId + new URLSearchParams(params);

    const response = await fetch(url, {
      method: 'GET',
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
  "_id": "5d6ede6a0ba62570afcedd3b",
  "name": "Andrew Jackso",
  "address": "5d6ede6a0ba62570afcedd3a",
  "roles": ["user"],
  "creditBalance": 100,
  "loginDate": "2022-02-22T02:02:22.679Z"
}
```

## Read Resource - Advanced

This entrypoint returns a target resource that includes selective data fields.

- `POST /{base_url}/__query/:id`
- The suffix `__query` can be configured using a model option, as demonstrated below:
  ```ts
  modelRouter.set('queryPath', '_queryable_');
  ```

### Parameters

| Name                         | Type                             | In    | Description                                                | Default |
| ---------------------------- | -------------------------------- | ----- | ---------------------------------------------------------- | ------- |
| `id`                         | string                           | param | Resource identifier; `required`                            |         |
| `select`                     | object \| array<string\>         | body  | Document fields to include or exclude                      |         |
| `populate`                   | array<string\> \| array<object\> | body  | Document fields to populate                                |         |
| `options.includePermissions` | boolean                          | body  | Whether to include document permissions                    | true    |
| `options.tryList`            | boolean                          | body  | Whether to attempt to retrieve the resource if not allowed | true    |
| `options.populateAccess`     | 'list' \| 'read'                 | body  | The access level to use in `populate` method               | read    |

### Example

#### request

=== "cURL"

    ```bash
    curl \
      -X POST \
      -H "Accept: application/json" \
      https://example.com/users/__query/5d6ede6a0ba62570afcedd3b \
      -d '{
        "select": ["name", "address"],
        "populate": ["address"],
        "options": {
          "includePermissions": true,
          "tryList": true,
          "populateAccess": "list"
        }
      }'
    ```

=== "Javascript"

    ```js
    const targetId = '5d6ede6a0ba62570afcedd3b';
    const data = {
      select: ['name', 'address'],
      populate: ['address'],
      options: {
        includePermissions: true,
        tryList: true,
        populateAccess: 'list'
      },
    };

    const url = 'https://example.com/users/__query/' + targetId;

    const response = await fetch(url, {
      method: 'POST',
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
  "name": "Andrew Jackso",
  "address": {
    "city": "Seattle",
    "country": "USA"
  },
  "_permissions": {
    "edit": false
  }
}
```
