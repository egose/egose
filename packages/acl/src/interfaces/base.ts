import express from 'express';
import { FilterQuery } from 'mongoose';
import { Core } from '../core';

export type Validation = boolean | string | string[] | Function;

export interface KeyValueProjection {
  [key: string]: 1 | -1;
}

export type Projection = string[] | string | KeyValueProjection;

export type SortOrder = -1 | 1 | 'asc' | 'ascending' | 'desc' | 'descending';

export type Sort = string | { [key: string]: SortOrder } | [string, SortOrder][] | undefined | null;

export type Filter = boolean | FilterQuery<any>;

export interface Include {
  model: string;
  op: 'list' | 'read';
  path: string;
  localField: string;
  foreignField: string;
  args?: any;
  options?: any;
}

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
  filter?: Filter;
  data?: any;
  args?: any;
  options?: any;
}

export interface SubQueryEntry extends RootQueryEntry {
  sqOptions?: {
    path?: string;
    compact?: boolean;
  };
}

export interface Request extends express.Request {
  query: Record<
    | 'skip'
    | 'limit'
    | 'page'
    | 'page_size'
    | 'try_list'
    | 'skim'
    | 'include_permissions'
    | 'include_count'
    | 'include_extra_headers'
    | 'returning_all',
    string
  >;
  macl: Core;
}

export interface ServiceResult {
  success: boolean;
  code: string;
  data: any;
  count?: number;
  totalCount?: number;
  input?: any;
  query?: any;
  errors?: any[];
}
