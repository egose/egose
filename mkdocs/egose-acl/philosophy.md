# Philosophy

`@egose/acl` is a package that provides REST API endpoints for [`mongoose`](https://mongoosejs.com/) data models in [`Express`](https://expressjs.com/) routes. It helps to secure the backend database by decorating mongoose queries with access control lists (ACLs), which are used to restrict access to sensitive data. The package also supports dynamic frontend mongoose-like query options, which allows developers to easily manipulate and query data from the frontend using familiar syntax. By using `@egose/acl`, developers can streamline their development process and reduce the risk of security breaches caused by unauthorized database access.

<a href="https://www.npmjs.com/package/@egose/acl" target="_blank"><img src="https://img.shields.io/npm/v/@egose/acl.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/package/@egose/acl" target="_blank"><img src="https://img.shields.io/npm/l/@egose/acl.svg" alt="Package License" /></a>
<a href="https://www.npmjs.com/package/@egose/acl" target="_blank"><img src="https://img.shields.io/npm/dm/@egose/acl.svg" alt="NPM Downloads" /></a>

## Motivation

RESTful APIs are widely used today, but they come with some disadvantages. One major challenge is managing object data at a fine-grained level. Consider the example of a User model with multiple fields, including `name`, `address`, `roles`, `creditBalance`, and `loginDate`. When retrieving or updating user entities using RESTful API endpoints, it can be difficult to control which fields are visible or editable depending on the requester's roles.

For instance, let's say we have an `admin` role that is allowed to read and update all fields of a user entity, while a `non-admin` role is only allowed to read a subset of fields. Excluding fields that `non-admin` is not allowed to read might not be enough, as some fields could be redundant for certain screens. Moreover, sending additional information to the API call, such as `include=partial[|all]`, could lead to a messy backend codebase as the number of fields and screens grows.

The problem becomes even more complex when it comes to updating user entities. Depending on the requester's role, different fields might be editable, and the logic for preventing unwanted updates can quickly become convoluted. This can result in multiple conditional statements in the backend codebase, making it difficult to maintain and scale.

To address these challenges, it's worth considering alternative API protocols or standards that might provide more fine-grained control over object data. In addition, it's important to adopt a consistent approach to data management that takes into account the specific needs of different roles and screens. By doing so, it's possible to build more secure and efficient RESTful APIs that can support a wide range of use cases.

## Concept

The concept behind this approach is to define a security boundary, in the form of a schema, for each resource that can be accessed via backend routes. By wrapping the request information sent by the browser, this security layer provides the frontend codebase with the flexibility to build queries and manage data within the API endpoints.

The library supports object permissions that define whether a user has the ability to perform a specific action on a single object. These permissions are also known as row-level permissions.

- Global Permissions

    Global permissions are system-wide and are granted to authenticated users based on their roles. They enable `role-based access control (RBAC)` to the backend system. Global permissions are expected to be provided in the `Express request object` (e.g., `req._permissions`) and are used to enforce access control to the system and resources.

- Document Permissions

    Document permissions are object-level privileges that define the specific actions that can be performed on a single `Mongoose document`.

- Role-based Security

- Document-level Security

- Field-level security

- Base Filter

    Base filters are generated to decorate the `Mongoose Query object` and apply global permissions to a target collection.

- Mongoose Query Syntax

    The library API endpoints have a similar request structure to the `Mongoose Syntax`, which includes filter, select, and populate options. This helps reduce the learning curve of using the tool.
