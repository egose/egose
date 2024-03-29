# Egose

`Egose` is a collection of toolkits that exposes REST API endpoints corresponding to mongoose data models in Express routes.

## Egose ACL

`@egose/acl` is a package that provides REST API endpoints for [`mongoose`](https://mongoosejs.com/) data models in [`Express`](https://expressjs.com/) routes. It helps to secure the backend database by decorating mongoose queries with access control lists (ACLs), which are used to restrict access to sensitive data. The package also supports dynamic frontend mongoose-like query options, which allows developers to easily manipulate and query data from the frontend using familiar syntax. By using `@egose/acl`, developers can streamline their development process and reduce the risk of security breaches caused by unauthorized database access.

<a href="https://www.npmjs.com/package/@egose/acl" target="_blank"><img src="https://img.shields.io/npm/v/@egose/acl.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/package/@egose/acl" target="_blank"><img src="https://img.shields.io/npm/l/@egose/acl.svg" alt="Package License" /></a>
<a href="https://www.npmjs.com/package/@egose/acl" target="_blank"><img src="https://img.shields.io/npm/dm/@egose/acl.svg" alt="NPM Downloads" /></a>

- see more details on [Egose ACL](https://egose.github.io/docs/egose-acl/philosophy/).

## Egose Deco

The `@egose/deco` package offers [`TypeScript Decorators`](https://www.typescriptlang.org/docs/handbook/decorators.html) that allow developers to define [`@egose/acl`](https://egose.github.io/docs/egose-acl/philosophy/) configurations and options through class and method `annotations`. By leveraging these decorators, developers can significantly enhance the readability and maintainability of their backend codebase. Overall, @egose/deco provides a powerful way to streamline authorization logic and improve code organization.

<a href="https://www.npmjs.com/package/@egose/deco" target="_blank"><img src="https://img.shields.io/npm/v/@egose/deco.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/package/@egose/deco" target="_blank"><img src="https://img.shields.io/npm/l/@egose/deco.svg" alt="Package License" /></a>
<a href="https://www.npmjs.com/package/@egose/deco" target="_blank"><img src="https://img.shields.io/npm/dm/@egose/deco.svg" alt="NPM Downloads" /></a>

- see more details on [Egose Deco](https://egose.github.io/docs/egose-deco/philosophy/).

## Egose Swagger

The `@egose/swagger` package provides support for the OpenAPI Specification (formerly known as Swagger Specification), which is a format used for describing REST APIs. It can be used to describe all the API endpoints that are generated by the [`@egose/acl`](https://egose.github.io/docs/egose-acl/philosophy/) model routers.

<a href="https://www.npmjs.com/package/@egose/swagger" target="_blank"><img src="https://img.shields.io/npm/v/@egose/swagger.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/package/@egose/swagger" target="_blank"><img src="https://img.shields.io/npm/l/@egose/swagger.svg" alt="Package License" /></a>
<a href="https://www.npmjs.com/package/@egose/swagger" target="_blank"><img src="https://img.shields.io/npm/dm/@egose/swagger.svg" alt="NPM Downloads" /></a>

- see more details on [Egose Swagger](https://egose.github.io/docs/egose-swagger/philosophy/).

## Egose Adapter in Javascript

The `@egose/adapter-js` package provides a Typescript/Javascript client adapter that facilitates communication with the Egose backend API endpoints. For a better understanding of these endpoints, you can check out [Egose ACL](https://egose.github.io/docs/egose-acl/philosophy/).

<a href="https://www.npmjs.com/package/@egose/adapter-js" target="_blank"><img src="https://img.shields.io/npm/v/@egose/adapter-js.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/package/@egose/adapter-js" target="_blank"><img src="https://img.shields.io/npm/l/@egose/adapter-js.svg" alt="Package License" /></a>
<a href="https://www.npmjs.com/package/@egose/adapter-js" target="_blank"><img src="https://img.shields.io/npm/dm/@egose/adapter-js.svg" alt="NPM Downloads" /></a>

- see more details on [Egose Adapter in Javascript](https://egose.github.io/docs/egose-adapter-js/philosophy/).

## References

- [HTTP Semantics](https://www.rfc-editor.org/rfc/rfc9110.html)
