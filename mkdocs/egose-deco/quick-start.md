# Quick Start

Before proceeding, make sure to install [`express`](https://www.npmjs.com/package/express), [`mongoose`](https://www.npmjs.com/package/mongoose) and [`reflect-metadata`](https://www.npmjs.com/package/reflect-metadata) as peer dependencies. These packages are required for the proper functioning of the application and must be installed prior to running the code. You can install them using the npm package manager.

## Installation

```sh
npm install express mongoose @egose/deco
npm install @types/express reflect-metadata --save-dev

```

```sh
yarn add express mongoose @egose/deco
yarn add @types/express reflect-metadata --dev
```

## Backend Configuration

### Model Router

Using the `Router` class decorator, you can define a model router class and specify various options and middleware functions with `annotations`. This approach helps to encapsulate and organize the routing logic for a given model, making the code more modular and easier to understand.

For example:

```ts
--8<-- '../../examples/deco/routes/user.router.ts'
```

### Router Module

After defining one or more model routers, you can use the `Module` class decorator to create an Egose Module that includes these routers. Within the `Egose Module`, you can also define the `Global Permissions` function, which provides the user context to each model's middleware functions. This approach helps to organize the routers in a hierarchical structure, making the code more modular and easier to understand. By leveraging the Module decorator, developers can create a centralized location for defining global permissions and integrating them across all of the model routers in their application.

For example:

```ts
--8<-- '../../examples/deco/routes/routers.module.ts'
```

### Bootstrapping the Module in an Express Server

Once you have defined the router module, you can bootstrap the API endpoints with the Express server. This involves encapsulating the Express routes within the module definition, which helps to ensure that the routing logic is properly organized and modularized. By leveraging the `bootstrap` function in the Egose library, developers can easily integrate their router modules with an Express server and start listening for incoming requests.

For example:

```ts
import express from 'express';
import { EgoseFactory } from '@egose/deco';

const app = express();
EgoseFactory.bootstrap(RoutersModule, app);
```
