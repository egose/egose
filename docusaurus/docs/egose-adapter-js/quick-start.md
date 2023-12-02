# Quick Start

## Installation

```sh
npm install @egose/adapter-js
```

```sh
yarn add @egose/adapter-js
```

## Usage

```ts
import egoseAdapter from "@egose/adapter-js";

const adapter = egoseAdapter.createAdapter({
  baseURL: "http://127.0.0.1:3000/api",
});

interface User {
  name?: string;
  role?: string;
  statusHistory?: any[];
  public?: boolean;
  [key: string]: any;
}

interface Org {
  name?: string;
  locations?: any[];
  [key: string]: any;
}

const userService = adapter.createModelService<User>({
  modelName: "User",
  basePath: "users",
});

const orgService = adapter.createModelService<Org>({
  modelName: "Org",
  basePath: "orgs",
});

userService
  .create({ name: "john", role: "user", public: false })
  .then(console.log);

userService
  .update(
    "8cb91bde3464f1461893aca4",
    { public: false },
    { returningAll: false }
  )
  .then(console.log);
```
