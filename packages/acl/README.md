# @egose/acl

`@egose/acl` is a package that provides REST API endpoints for [`mongoose`](https://mongoosejs.com/) data models in [`Express`](https://expressjs.com/) routes. It helps to secure the backend database by decorating mongoose queries with access control lists (ACLs), which are used to restrict access to sensitive data. The package also supports dynamic frontend mongoose-like query options, which allows developers to easily manipulate and query data from the frontend using familiar syntax. By using `@egose/acl`, developers can streamline their development process and reduce the risk of security breaches caused by unauthorized database access.

<a href="https://www.npmjs.com/package/@egose/acl" target="_blank"><img src="https://img.shields.io/npm/v/@egose/acl.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/package/@egose/acl" target="_blank"><img src="https://img.shields.io/npm/l/@egose/acl.svg" alt="Package License" /></a>
<a href="https://www.npmjs.com/package/@egose/acl" target="_blank"><img src="https://img.shields.io/npm/dm/@egose/acl.svg" alt="NPM Downloads" /></a>

## Documentation

please see [Egose documentation](https://egose.github.io/egose-acl/philosophy/) for more details.

## Installation

```sh
npm install express mongoose @egose/acl
npm install @types/express --save-dev

```

```sh
yarn add express mongoose @egose/acl
yarn add @types/express --dev
```

### [MIT Licensed](LICENSE)
