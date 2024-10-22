import express from 'express';
import { Validation } from './base';
import { PublicCreateArgs, CreateArgs, PublicCreateOptions, CreateOptions } from './service-create';
import {
  PublicUpdateArgs,
  PublicUpdateOptions,
  UpdateOneArgs,
  UpdateOneOptions,
  UpsertOptions,
  UpdateByIdArgs,
  UpsertArgs,
  UpdateByIdOptions,
} from './service-update';
import { PublicListArgs, PublicListOptions } from './service-list';
import { PublicReadArgs, PublicReadOptions } from './service-read';
import { FindArgs, FindOptions, FindOneArgs, FindOneOptions, FindByIdArgs, FindByIdOptions } from './service-find';
import { ExistsOptions } from './service-exists';
import { DistinctArgs } from './service';

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
  upsertOptions?: UpsertOptions;
  updateByIdArgs?: UpdateByIdArgs;
  upsertArgs?: UpsertArgs;
  updateByIdOptions?: UpdateByIdOptions;
  existsOptions?: ExistsOptions;
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
  modelPermissionPrefix?: string;
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
  _permissionSchemaKeys?: string[];
  _globalPermissionKeys?: string[];
  _modelPermissionKeys?: string[];
  mandatoryFields?: string[];
  docPermissions?: DocPermissions | Function;
  baseFilter?: any;
  overrideFilter?: any;
  decorate?: any;
  decorateAll?: any;
  validate?: any;
  prepare?: any;
  transform?: any;
  change?: Record<string, Function>;
  defaults?: Defaults;
}

export interface DataRouterOptions {
  data?: any[];
  listHardLimit?: number;
  idParam?: string;
  identifier?: string | Function;
  parentPath?: string;
  queryPath?: string;
  routeGuard?: Validation | Access;
  dataName?: string;
  basePath?: string;
  permissionSchema?: PermissionSchema;
  baseFilter?: any;
  overrideFilter?: any;
  decorate?: any;
  decorateAll?: any;
}

export interface ExtendedModelRouterOptions extends ModelRouterOptions, ExtendedDefaultModelRouterOptions {
  'mandatoryFields.default'?: string[];
  'mandatoryFields.list'?: string[];
  'mandatoryFields.create'?: string[];
  'mandatoryFields.read'?: string[];
  'mandatoryFields.update'?: string[];
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
  'overrideFilter.default'?: any;
  'overrideFilter.list'?: any;
  'overrideFilter.read'?: any;
  'overrideFilter.update'?: any;
  'overrideFilter.delete'?: any;
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
  'finalize.default'?: any;
  'finalize.create'?: any;
  'finalize.update'?: any;
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
  'defaults.existsOptions'?: ExistsOptions;
  'defaults.publicListArgs'?: PublicListArgs;
  'defaults.publicListOptions'?: PublicListOptions;
  'defaults.publicCreateArgs'?: PublicCreateArgs;
  'defaults.publicCreateOptions'?: PublicCreateOptions;
  'defaults.publicReadArgs'?: PublicReadArgs;
  'defaults.publicReadOptions'?: PublicReadOptions;
  'defaults.publicUpdateArgs'?: PublicUpdateArgs;
  'defaults.publicUpdateOptions'?: PublicUpdateOptions;
}

export type SelectAccess = 'list' | 'create' | 'read' | 'update' | string;
export type RouteGuardAccess =
  | 'new'
  | 'list'
  | 'read'
  | 'update'
  | 'delete'
  | 'create'
  | 'distinct'
  | 'count'
  | 'subs'
  | string;
export type DocPermissionsAccess = 'list' | 'create' | 'read' | 'update' | string;
export type BaseFilterAccess = 'list' | 'read' | 'update' | 'delete' | string;
export type DecorateAccess = 'list' | 'create' | 'read' | 'update' | string;
export type DecorateAllAccess = 'list' | string;
export type ValidateAccess = 'create' | 'update' | string;
export type PrepareAccess = 'create' | 'update' | string;
export type TransformAccess = 'update' | string;
export type FinalizeAccess = 'create' | 'update' | string;
