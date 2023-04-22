# Quick Start

Before proceeding, make sure to install [`express`](https://www.npmjs.com/package/express), [`mongoose`](https://www.npmjs.com/package/mongoose) and [`@egose/acl`](https://www.npmjs.com/package/@egose/acl) as peer dependencies. These packages are required for the proper functioning of the application and must be installed prior to running the code. You can install them using the npm package manager.

## Installation

```sh
npm install express mongoose @egose/acl
npm install @types/express --save-dev

```

```sh
yarn add express mongoose @egose/acl
yarn add @types/express --dev
```

## Backend Configuration

### Bootstrapping the Swagger routes in an Express Server

```ts
--8<-- 'quick-start-swagger.ts'
```
