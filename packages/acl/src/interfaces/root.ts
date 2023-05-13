import express from 'express';
import { Validation } from './base';
import { PublicCreateArgs, CreateArgs, PublicCreateOptions, CreateOptions } from './controller-create';
import {
  PublicUpdateArgs,
  PublicUpdateOptions,
  UpdateOneArgs,
  UpdateOneOptions,
  UpdateByIdArgs,
  UpdateByIdOptions,
} from './controller-update';
import { PublicListArgs, PublicListOptions } from './controller-list';
import { PublicReadArgs, PublicReadOptions } from './controller-read';
import { FindArgs, FindOptions, FindOneArgs, FindOneOptions, FindByIdArgs, FindByIdOptions } from './controller-find';
import { DistinctArgs } from './controller';

interface DefaultFindOneArgs extends Omit<FindOneArgs, 'overrides'> {}
interface DefaultFindByIdArgs extends Omit<FindByIdArgs, 'overrides'> {}
interface DefaultFindArgs extends Omit<FindArgs, 'overrides'> {}

export interface Defaults {
  findOneArgs?: DefaultFindOneArgs;
  findOneOptions?: FindOneOptions;
  findByIdArgs?: DefaultFindByIdArgs;
  findByIdOptions?: FindByIdOptions;
  findArgs?: DefaultFindArgs;
  findOptions?: FindOptions;
  createArgs?: CreateArgs;
  createOptions?: CreateOptions;
  updateOneArgs?: UpdateOneArgs;
  updateOneOptions?: UpdateOneOptions;
  updateByIdArgs?: UpdateByIdArgs;
  updateByIdOptions?: UpdateByIdOptions;
  publicListArgs?: PublicListArgs;
  publicListOptions?: PublicListOptions;
  publicCreateArgs?: PublicCreateArgs;
  publicCreateOptions?: PublicCreateOptions;
  publicReadArgs?: PublicReadArgs;
  publicReadOptions?: PublicReadOptions;
  publicUpdateArgs?: PublicUpdateArgs;
  publicUpdateOptions?: PublicUpdateOptions;
}

export interface GlobalOptions {
  permissionField?: string;
  globalPermissions?: (req: express.Request) => any;
}

export interface RootRouterOptions {
  basePath: string;
  routeGuard?: Validation;
}

interface Access {
  list?: Validation;
  create?: Validation;
  read?: Validation;
  update?: Validation;
  delete?: Validation;
  distinct?: Validation;
  count?: Validation;
  sub?: any;
}

interface PermissionSchema {
  [key: string]: Access;
}

interface DocPermissions {
  list?: Function;
  create?: Function;
  read?: Function;
  update?: Function;
}

export interface DefaultModelRouterOptions {
  listHardLimit?: number;
  permissionField?: string;
  idParam?: string;
  identifier?: string | Function;
  parentPath?: string;
  queryPath?: string;
  mutationPath?: string;
  routeGuard?: Validation | Access;
}

export interface ExtendedDefaultModelRouterOptions extends DefaultModelRouterOptions {
  'routeGuard.default'?: Validation;
  'routeGuard.new'?: Validation;
  'routeGuard.list'?: Validation;
  'routeGuard.read'?: Validation;
  'routeGuard.update'?: Validation;
  'routeGuard.delete'?: Validation;
  'routeGuard.create'?: Validation;
  'routeGuard.distinct'?: Validation;
  'routeGuard.count'?: Validation;
  'routeGuard.subs'?: any;
}

export interface ModelRouterOptions extends DefaultModelRouterOptions {
  modelName?: string;
  basePath?: string;
  permissionSchema?: PermissionSchema;
  permissionSchemaKeys?: string[];
  mandatoryFields?: string[];
  docPermissions?: DocPermissions | Function;
  baseFilter?: any;
  decorate?: any;
  decorateAll?: any;
  validate?: any;
  prepare?: any;
  transform?: any;
  defaults?: Defaults;
}

export interface ExtendedModelRouterOptions extends ModelRouterOptions, ExtendedDefaultModelRouterOptions {
  'docPermissions.default'?: Function;
  'docPermissions.list'?: Function;
  'docPermissions.create'?: Function;
  'docPermissions.read'?: Function;
  'docPermissions.update'?: Function;
  'baseFilter.default'?: any;
  'baseFilter.list'?: any;
  'baseFilter.read'?: any;
  'baseFilter.update'?: any;
  'baseFilter.delete'?: any;
  'decorate.default'?: any;
  'decorate.list'?: any;
  'decorate.create'?: any;
  'decorate.read'?: any;
  'decorate.update'?: any;
  'decorateAll.default'?: any;
  'decorateAll.list'?: any;
  'validate.default'?: any;
  'validate.create'?: any;
  'validate.update'?: any;
  'prepare.default'?: any;
  'prepare.create'?: any;
  'prepare.update'?: any;
  'transform.default'?: any;
  'transform.update'?: any;
  'defaults.findOneArgs'?: DefaultFindOneArgs;
  'defaults.findOneOptions'?: FindOneOptions;
  'defaults.findByIdArgs'?: DefaultFindByIdArgs;
  'defaults.findByIdOptions'?: FindByIdOptions;
  'defaults.findArgs'?: DefaultFindArgs;
  'defaults.findOptions'?: FindOptions;
  'defaults.createArgs'?: CreateArgs;
  'defaults.createOptions'?: CreateOptions;
  'defaults.updateOneArgs'?: UpdateOneArgs;
  'defaults.updateOneOptions'?: UpdateOneOptions;
  'defaults.updateByIdArgs'?: UpdateByIdArgs;
  'defaults.updateByIdOptions'?: UpdateByIdOptions;
  'defaults.publicListArgs'?: PublicListArgs;
  'defaults.publicListOptions'?: PublicListOptions;
  'defaults.publicCreateArgs'?: PublicCreateArgs;
  'defaults.publicCreateOptions'?: PublicCreateOptions;
  'defaults.publicReadArgs'?: PublicReadArgs;
  'defaults.publicReadOptions'?: PublicReadOptions;
  'defaults.publicUpdateArgs'?: PublicUpdateArgs;
  'defaults.publicUpdateOptions'?: PublicUpdateOptions;
}

export type SelectAccess = 'list' | 'create' | 'read' | 'update';
export type RouteGuardAccess = 'new' | 'list' | 'read' | 'update' | 'delete' | 'create' | 'distinct' | 'count' | 'subs';
export type DocPermissionsAccess = 'list' | 'create' | 'read' | 'update';
export type BaseFilterAccess = 'list' | 'read' | 'update' | 'delete';
export type DecorateAccess = 'list' | 'create' | 'read' | 'update';
export type DecorateAllAccess = 'list';
export type ValidateAccess = 'create' | 'update';
export type PrepareAccess = 'create' | 'update';
export type TransformAccess = 'update';
