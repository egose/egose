# Egose

`Egose` is a collection of toolkits that exposes REST API endpoints corresponding to mongoose data models in Express routes.

## Egose ACL

`@egose/acl` is a package that provides REST API endpoints for [`mongoose`](https://mongoosejs.com/) data models in [`Express`](https://expressjs.com/) routes. It helps to secure the backend database by decorating mongoose queries with access control lists (ACLs), which are used to restrict access to sensitive data. The package also supports dynamic frontend mongoose-like query options, which allows developers to easily manipulate and query data from the frontend using familiar syntax. By using `@egose/acl`, developers can streamline their development process and reduce the risk of security breaches caused by unauthorized database access.

- see more details on [Egose ACL](/egose-acl/philosophy/)

## Egose Deco

The `@egose/deco` package offers [`TypeScript Decorators`](https://www.typescriptlang.org/docs/handbook/decorators.html) that allow developers to define [`@egose/acl`](../../egose-acl/philosophy/) configurations and options through class and method `annotations`. By leveraging these decorators, developers can significantly enhance the readability and maintainability of their backend codebase. Overall, @egose/deco provides a powerful way to streamline authorization logic and improve code organization.

- see more details on [Egose Deco](/egose-deco/philosophy/)
