## Count Documents

This entrypoint returns the count of documents that the requester is allowed to read.

- `GET /{base_url}/count`

### Example

#### request

=== "cURL"

    ```bash
    curl \
      -X GET \
      -H "Accept: application/json" \
      https://example.com/users/count
    ```

=== "Javascript"

    ```js
    const url = 'https://example.com/users/count';

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
3
```

## Count Documents - Advanced

This entrypoint returns the count of documents that would match a query for the collection.

- `POST /{base_url}/count`

### Parameters

| Name     | Type             | In   | Description              | Default |
| -------- | ---------------- | ---- | ------------------------ | ------- |
| `filter` | object           | body | Mongoose `Filter` object |         |
| `access` | 'list' \| 'read' | body | The access level         | list    |

### Example

#### request

=== "cURL"

    ```bash
    curl \
      -X POST \
      -H "Accept: application/json" \
      https://example.com/users/count \
      -d '{
        "filter": {
          "name": { "$regex": "drew", "$options": "i" }
        },
        "access": "list"
      }'
    ```

=== "Javascript"

    ```js
    const data = {
      filter: {
        name: { $regex: 'drew', $options: 'i' },
      },
      access: 'list',
    };

    const url = 'https://example.com/users/count';

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
2
```
