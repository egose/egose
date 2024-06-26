import express from 'express';
import mongoose, { FilterQuery, Document } from 'mongoose';
import { Diff } from 'deep-diff';
import { Core } from '../core';
import { DataCore } from '../core-data';

export type Validation = boolean | string | string[] | Function;

export interface KeyValueProjection {
  [key: string]: 1 | -1;
}

export type Projection = string[] | string | KeyValueProjection;

export type SortOrder = -1 | 1 | 'asc' | 'ascending' | 'desc' | 'descending';

export type Sort = string | { [key: string]: SortOrder } | [string, SortOrder][] | undefined | null;

export type Filter = false | FilterQuery<any>;

export interface Include {
  model: string;
  op: 'list' | 'read' | 'count';
  path: string;
  filter?: Filter;
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
  modelName: string;
  model: mongoose.Model<any>;
  originalDocObject?: Record<string, any>;
  finalDocObject?: Record<string, any>;
  diff?(doc: Document): void;
  currentDoc?: keyValue;
  originalData?: Record<string, any>;
  preparedData?: Record<string, any>;
  modifiedPaths?: string[];
  changes?: Diff<any>[];
  docPermissions?: keyValue;
}

export interface DataMiddlewareContext {}

export interface RootQueryEntry {
  model: string;
  op: string;
  id?: string;
  field?: string;
  filter?: Filter;
  data?: any;
  args?: any;
  options?: any;
  order?: number;
}

export interface SubQueryEntry extends RootQueryEntry {
  sqOptions?: {
    path?: string;
    compact?: boolean;
  };
}

export interface Task {
  type: string;
  args: any;
  options: { [key: string]: any };
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
  dacl: DataCore;
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
  context?: MiddlewareContext;
  contexts?: MiddlewareContext[];
}
