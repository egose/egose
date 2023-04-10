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

interface DefaultFindOneArgs extends Omit<FindOneArgs, 'query' | 'overrides'> {}
interface DefaultFindByIdArgs extends Omit<FindByIdArgs, 'overrides'> {}
interface DefaultFindArgs extends Omit<FindArgs, 'query' | 'overrides'> {}
interface DefaultPublicListArgs extends Omit<PublicListArgs, 'query'> {}

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
  _listArgs?: DefaultPublicListArgs;
  _listOptions?: PublicListOptions;
  _createArgs?: PublicCreateArgs;
  _createOptions?: PublicCreateOptions;
  _readArgs?: PublicReadArgs;
  _readOptions?: PublicReadOptions;
  _updateArgs?: PublicUpdateArgs;
  _updateOptions?: PublicUpdateOptions;
}

export interface GlobalOptions {
  permissionField?: string;
  globalPermissions?: (req: any) => any;
  idParam?: string;
  queryPath?: string;
  mutationPath?: string;
}

export interface RootRouterOptions {
  baseUrl: string | false;
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

export interface ModelRouterOptions {
  baseUrl?: string | false;
  listHardLimit?: number;
  permissionSchema?: PermissionSchema;
  permissionSchemaKeys?: string[];
  permissionField?: string;
  mandatoryFields?: string[];
  docPermissions?: DocPermissions | Function;
  routeGuard?: Validation | Access;
  baseFilter?: any;
  decorate?: any;
  decorateAll?: any;
  validate?: any;
  prepare?: any;
  transform?: any;
  identifier?: string | Function;
  defaults?: Defaults;
  idParam?: string;
  queryPath?: string;
  mutationPath?: string;
}
