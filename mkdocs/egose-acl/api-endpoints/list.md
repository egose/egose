## List Resources

This entrypoint returns a set of resources.

- `GET /{base_url}`

### Parameters

| Name                  | Type    | In    | Description                                         | Default    |
| --------------------- | ------- | ----- | --------------------------------------------------- | ---------- |
| `limit`               | number  | query | The maximum number of documents                     | 1000 (max) |
| `page`                | number  | query | The page number of documents; starts from 1         | 1          |
| `include_permissions` | boolean | query | Whether to include document permissions             | true       |
| `include_count`       | boolean | query | Whether to include total results count              | false      |
| `skim`                | boolean | query | Whether to bypass Document-level permissions checks | false      |

### Example

#### request

=== "cURL"

    ```bash
    curl \
      -H "Accept: application/json" \
      https://example.com/users?limit=100&page=5&include_permissions=false&include_count=false
    ```

=== "Javascript"

    ```js
    const params = {
      limit: 100,
      page: 5,
      include_permissions: false,
      include_count: false
    };

    const url = 'https://example.com/users' + new URLSearchParams(params);

    const response = await fetch(url, {
      method: 'GET',
      headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
    });

    const result = response.json();
    ```

#### response

```
Status: 200
```

```json
[
  {
    "name": "Andrew Jackso",
    "address": "5d6ede6a0ba62570afcedd3a",
    "role": "user",
    "creditBalance": 100,
    "loginDate": "2022-02-22T02:02:22.679Z"
  }
]
```

## List Resources - Advanced

This entrypoint returns a set of filtered resources that includes selective data fields.

- `POST /{base_url}/__query`
- The suffix `__query` can be configured using a model option, as demonstrated below:
  ```ts
  modelRouter.set('queryPath', '_queryable_');
  ```

### Parameters

| Name                         | Type                             | In   | Description                                                        | Default    |
| ---------------------------- | -------------------------------- | ---- | ------------------------------------------------------------------ | ---------- |
| `filter`                     | object                           | body | Mongoose `Filter` object                                           |            |
| `select`                     | object \| array<string\>         | body | Document fields to include or exclude                              |            |
| `populate`                   | array<string\> \| array<object\> | body | Document fields to populate                                        |            |
| `sort`                       | string \| object                 | body | Document sort order                                                |            |
| `skip`                       | number                           | body | The number of documents to skip; used over `page` if specified     |            |
| `limit`                      | number                           | body | The maximum number of documents; used over `pageSize` if specified | 1000 (max) |
| `page`                       | number                           | body | The page number of documents; starts from 1                        | 1          |
| `pageSize`                   | number                           | body | The maximum number of documents                                    | 1          |
| `options.includePermissions` | boolean                          | body | Whether to include document permissions                            | true       |
| `options.includeCount`       | boolean                          | body | Whether to include total results count                             | false      |
| `options.populateAccess`     | 'list' \| 'read'                 | body | The access level to use in `populate` method                       | read       |

### Example

#### request

=== "cURL"

    ```bash
    curl \
      -X POST \
      -H "Accept: application/json" \
      https://example.com/users/__query \
      -d '{
        "filter": { "loginDate": { "$gte": "2022-02-22T02:02:22.679Z" } },
        "select": ["name", "address"],
        "populate": ["address"],
        "sort": { "createdAt": -1 },
        "limit": 100,
        "page": 5,
        "options": {
          "includePermissions": true,
          "includeCount": true,
          "populateAccess": "list"
        }
      }'
    ```

=== "Javascript"

    ```js
    const data = {
      filter: { loginDate: { $gte: '2022-02-22T02:02:22.679Z' } },
      select: ['name', 'address'],
      populate: ['address'],
      sort: { createdAt: -1 },
      limit: 100,
      page: 5,
      options: {
        includePermissions: true,
        includeCount: true,
        populateAccess: 'list'
      },
    };

    const url = 'https://example.com/users/__query';

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
  "count": 2,
  "rows": [
    {
      "_id": "5d6ede6a0ba62570afcedd3a",
      "name": "Mike",
      "address": {
        "city": "Seattle",
        "country": "USA"
      },
      "_permissions": {
        "edit": true
      }
    },
    {
      "_id": "5d6ede6a0ba62570afcedd3b",
      "name": "Jennifer",
      "address": {
        "city": "Vancouver",
        "country": "Canada"
      },
      "_permissions": {
        "edit": false
      }
    }
  ]
}
```
