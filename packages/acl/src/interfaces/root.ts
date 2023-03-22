import { Validation } from './base';
import { FindProps, FindOneProps, FindByIdProps } from './controller';
import { ListProps, ReadProps, CreateOptions, UpdateOptions, DistinctOptions } from './public-controller';

export interface RootRouterOptions {
  baseUrl: string | false;
  routeGuard?: Validation;
}

export interface Defaults {
  list?: ListProps;
  create?: CreateOptions;
  read?: ReadProps;
  update?: UpdateOptions;
  distinct?: DistinctOptions;
  find?: FindProps;
  findOne?: FindOneProps;
  findById?: FindByIdProps;
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
  baseQuery?: any;
  decorate?: any;
  decorateAll?: any;
  validate?: any;
  prepare?: any;
  transform?: any;
  identifier?: string | Function;
  defaults?: Defaults;
  idParam?: string;
  queryPath?: string;
}
