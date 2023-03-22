import { CORE } from '../symbols';
import { MaclCore, ControllerFactory } from '../generators';

export interface GlobalOptions {
  permissionField?: string;
  idParam?: string;
  queryPath?: string;
  globalPermissions?: (req: any) => any;
}

export type Validation = boolean | string | string[] | Function;

interface KeyValueProjection {
  [key: string]: 1 | -1;
}

export type Projection = string[] | string | KeyValueProjection;

export interface Populate {
  path: string;
  select?: Projection;
  match?: any;
  access?: string;
}

export interface SubPopulate {
  path: string;
  select?: Projection;
}

interface keyValue {
  [key: string]: any;
}

export interface MiddlewareContext {
  originalDoc?: keyValue;
  currentDoc?: keyValue;
  originalData?: keyValue;
  preparedData?: keyValue;
  modifiedPaths?: string[];
  docPermissions?: keyValue;
}

export interface RootQueryEntry {
  modelName: string;
  operation: string;
  arguments: any[];
}

export interface Request {
  query: Record<
    'limit' | 'page' | 'lean' | 'try_list' | 'include_permissions' | 'include_count' | 'returning_all',
    string
  >;
  params: Record<string, string>;
  body: any;
  [CORE]: MaclCore;
  macl: ControllerFactory;
}
