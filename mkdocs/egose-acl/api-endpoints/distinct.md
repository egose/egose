## Distinct Field Values

This entrypoint finds the distinct values for a specified field across a target collection and returns the results in an array.

- `GET /{base_url}/distinct/:field`

### Parameters

| Name    | Type   | In    | Description                                   |
| ------- | ------ | ----- | --------------------------------------------- |
| `field` | string | param | The field for which to return distinct values |

### Example

#### request

=== "cURL"

    ```bash
    curl \
      -X GET \
      -H "Accept: application/json" \
      https://example.com/users/distinct/name
    ```

=== "Javascript"

    ```js
    const targetField = 'name';
    const url = 'https://example.com/users/distinct/' + targetField;

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
["Andrew", "Andrew-2nd", "Mike"]
```

## Distinct Field Values - Advanced

This entrypoint finds the distinct values for a specified field across a target collection and returns the results in an array.

- `POST /{base_url}/distinct/:field`

### Parameters

| Name     | Type   | In    | Description                                                                     |
| -------- | ------ | ----- | ------------------------------------------------------------------------------- |
| `field`  | string | param | The field for which to return distinct values                                   |
| `filter` | string | body  | Mongose `Filter` that specifies the match rules to retrieve the distinct values |

### Example

#### request

=== "cURL"

    ```bash
    curl \
      -X POST \
      -H "Accept: application/json" \
      https://example.com/users/distinct/name \
      -d '{
        "filter": {
          "name": { "$regex": "drew", "$options": "i" }
        }
      }'
    ```

=== "Javascript"

    ```js
    const targetField = 'name';

    const data = {
      filter: {
        name: { $regex: 'drew', $options: 'i' },
      },
    };

    const url = 'https://example.com/users/distinct/' + targetField;

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
["Andrew", "Andrew-2nd"]
```
