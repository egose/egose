## New Resource

This entrypoint returns an empty resource and is used to retrieve sample data as a placeholder.

- `GET /{base_url}/new`

### Example

#### request

=== "cURL"

    ```bash
    curl \
      -X GET \
      -H "Accept: application/json" \
      https://example.com/users/new
    ```

=== "Javascript"

    ```js
    const url = 'https://example.com/users/new';

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
  "name": null,
  "address": null,
  "roles": ["user"],
  "creditBalance": 0,
  "loginDate": null
}
```
