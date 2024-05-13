import { Projection, Sort, Populate, PopulateAccess, Include } from './types';

export interface sqOptions {
  path?: string;
  compact?: boolean;
}

export interface ListArgs {
  skip?: number;
  limit?: number;
  page?: number;
  pageSize?: number;
}

export interface ListOptions {
  skim?: boolean;
  includePermissions?: boolean;
  includeCount?: boolean;
  includeExtraHeaders?: boolean;
  ignoreCache?: boolean;
  sq?: sqOptions;
}

export interface ListAdvancedArgs {
  select?: Projection;
  populate?: Populate[] | Populate | string;
  include?: Include | Include[];
  sort?: Sort;
  skip?: string | number;
  limit?: string | number;
  page?: string | number;
  pageSize?: string | number;
}

export interface ListAdvancedOptions {
  skim?: boolean;
  includePermissions?: boolean;
  includeCount?: boolean;
  includeExtraHeaders?: boolean;
  ignoreCache?: boolean;
  populateAccess?: PopulateAccess;
  sq?: sqOptions;
}

export interface ReadOptions {
  includePermissions?: boolean;
  tryList?: boolean;
  ignoreCache?: boolean;
  sq?: sqOptions;
}

export interface ReadAdvancedArgs {
  select?: Projection;
  populate?: Populate[] | Populate | string;
  include?: Include | Include[];
}

export interface ReadAdvancedOptions {
  includePermissions?: boolean;
  tryList?: boolean;
  populateAccess?: PopulateAccess;
  ignoreCache?: boolean;
  sq?: sqOptions;
}

export interface CreateOptions {
  includePermissions?: boolean;
}

export interface CreateAdvancedArgs {
  select?: Projection;
  populate?: Populate[] | Populate | string;
}

export interface CreateAdvancedOptions {
  includePermissions?: boolean;
  populateAccess?: PopulateAccess;
}

export interface UpdateOptions {
  returningAll?: boolean;
}

export interface UpdateAdvancedArgs {
  select?: Projection;
  populate?: Populate[] | Populate | string;
}

export interface UpdateAdvancedOptions {
  returningAll?: boolean;
  includePermissions?: boolean;
  populateAccess?: PopulateAccess;
}

export interface Defaults {
  listArgs?: ListArgs;
  listOptions?: ListOptions;
  listAdvancedArgs?: ListAdvancedArgs;
  listAdvancedOptions?: ListAdvancedOptions;
  readOptions?: ReadOptions;
  readAdvancedArgs?: ReadAdvancedArgs;
  readAdvancedOptions?: ReadAdvancedOptions;
  createOptions?: CreateOptions;
  createAdvancedArgs?: CreateAdvancedArgs;
  createAdvancedOptions?: CreateAdvancedOptions;
  updateOptions?: UpdateOptions;
  updateAdvancedArgs?: UpdateAdvancedArgs;
  updateAdvancedOptions?: UpdateAdvancedOptions;
}

export interface DataListArgs {
  skip?: number;
  limit?: number;
  page?: number;
  pageSize?: number;
}

export interface DataListOptions {
  includePermissions?: boolean;
  includeCount?: boolean;
  includeExtraHeaders?: boolean;
  ignoreCache?: boolean;
}

export interface DataListAdvancedArgs {
  select?: Projection;
  sort?: Sort;
  skip?: string | number;
  limit?: string | number;
  page?: string | number;
  pageSize?: string | number;
}

export interface DataListAdvancedOptions {
  includePermissions?: boolean;
  includeCount?: boolean;
  includeExtraHeaders?: boolean;
  ignoreCache?: boolean;
}

export interface DataReadOptions {
  includePermissions?: boolean;
  ignoreCache?: boolean;
}

export interface DataReadAdvancedArgs {
  select?: Projection;
  ignoreCache?: boolean;
}

export interface DataReadAdvancedOptions {
  includePermissions?: boolean;
  ignoreCache?: boolean;
}

export interface DataDefaults {
  listArgs?: DataListArgs;
  listOptions?: DataListOptions;
  listAdvancedArgs?: DataListAdvancedArgs;
  listAdvancedOptions?: DataListAdvancedOptions;
  readOptions?: DataReadOptions;
  readAdvancedArgs?: DataReadAdvancedArgs;
  readAdvancedOptions?: DataReadAdvancedOptions;
}

export interface AdditionalReqConfig {
  throwOnError?: boolean;
}
