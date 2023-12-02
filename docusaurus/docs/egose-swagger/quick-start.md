---
sidebar_label: Quick Start
sidebar_position: 1
---

# Quick Start

```mdx-code-block
import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';
import CodeBlock from '@theme/CodeBlock';
```

Before proceeding, make sure to install [`express`](https://www.npmjs.com/package/express), [`mongoose`](https://www.npmjs.com/package/mongoose) and [`@egose/acl`](https://www.npmjs.com/package/@egose/acl) as peer dependencies. These packages are required for the proper functioning of the application and must be installed prior to running the code. You can install them using the npm package manager.

## Installation

```bash npm2yarn
npm install express mongoose @egose/swagger
npm install @types/express --save-dev
```

## Backend Configuration

### Bootstrapping the Swagger routes in an Express Server

```mdx-code-block
import QuickStartSwagger from '!!raw-loader!../../.samples/quick-start-swagger.ts';

<CodeBlock language="ts">{QuickStartSwagger}</CodeBlock>
```
