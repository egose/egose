import express from 'express';
import { CORE } from '../symbols';
import { MaclCore, ControllerFactory } from '../generators';

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

export interface Request extends express.Request {
  query: Record<
    | 'skip'
    | 'limit'
    | 'page'
    | 'page_size'
    | 'lean'
    | 'try_list'
    | 'include_permissions'
    | 'include_count'
    | 'returning_all',
    string
  >;
  [CORE]: MaclCore;
  macl: ControllerFactory;
}
