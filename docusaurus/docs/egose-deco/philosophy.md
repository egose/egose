---
sidebar_label: Philosophy
sidebar_position: 0
---

# Philosophy

```mdx-code-block
import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';
import CodeBlock from '@theme/CodeBlock';
```

The `@egose/deco` package offers [`TypeScript Decorators`](https://www.typescriptlang.org/docs/handbook/decorators.html) that allow developers to define [`@egose/acl`](../../docs/egose-acl/philosophy/) configurations and options through class and method `annotations`. By leveraging these decorators, developers can significantly enhance the readability and maintainability of their backend codebase. Overall, @egose/deco provides a powerful way to streamline authorization logic and improve code organization.

<a href="https://www.npmjs.com/package/@egose/deco" target="_blank"><img src="https://img.shields.io/npm/v/@egose/deco.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/package/@egose/deco" target="_blank"><img src="https://img.shields.io/npm/l/@egose/deco.svg" alt="Package License" /></a>
<a href="https://www.npmjs.com/package/@egose/deco" target="_blank"><img src="https://img.shields.io/npm/dm/@egose/deco.svg" alt="NPM Downloads" /></a>

## Annotations

### Class Decorators

- Module
- Router

### Method Decorators

- GlobalPermissions
- DocPermissions
- BaseFilter
- Validate
- Prepare
- Transform
- Decorate
- DecorateAll
- RouteGuard

### Parameter Decorators

- Request
- Document
- Permissions
- Context

### Property Decorators

- Option
