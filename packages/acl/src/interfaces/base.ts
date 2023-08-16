import express from 'express';
import { CORE } from '../symbols';
import { MaclCore, ControllerFactory } from '../generators';

export type Validation = boolean | string | string[] | Function;

export interface KeyValueProjection {
  [key: string]: 1 | -1;
}

export type Projection = string[] | string | KeyValueProjection;

export type FindAccess = 'list' | 'read';
export type PopulateAccess = 'list' | 'read';

export interface Populate {
  path: string;
  select?: Projection;
  match?: any;
  access?: PopulateAccess;
}

export interface SubPopulate {
  path: string;
  select?: Projection;
}

interface keyValue {
  [key: string]: any;
}

export interface MiddlewareContext {
  originalDocObject?: keyValue;
  finalDocObject?: keyValue;
  currentDoc?: keyValue;
  originalData?: keyValue;
  preparedData?: keyValue;
  modifiedPaths?: string[];
  docPermissions?: keyValue;
}

export interface RootQueryEntry {
  model: string;
  op: string;
  id?: string;
  field?: string;
  filter?: any;
  data?: any;
  args?: any;
  options?: any;
}

export interface Request extends express.Request {
  query: Record<
    | 'skip'
    | 'limit'
    | 'page'
    | 'page_size'
    | 'try_list'
    | 'include_permissions'
    | 'include_count'
    | 'include_extra_headers'
    | 'returning_all',
    string
  >;
  [CORE]: MaclCore;
  macl: ControllerFactory;
}

export interface ControllerResult {
  success: boolean;
  code: string;
  data: any;
  count?: number;
  totalCount?: number;
  input?: any;
  query?: any;
  errors?: any[];
}
