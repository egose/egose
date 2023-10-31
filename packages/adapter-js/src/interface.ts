import { Projection, Populate, PopulateAccess } from './types';

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
  sq?: sqOptions;
}

export interface ListAdvancedArgs {
  select?: Projection;
  populate?: Populate[] | Populate | string;
  sort?: string[] | string;
  skip?: string | number;
  limit?: string | number;
  page?: string | number;
  pageSize?: string | number;
}

export interface ListAdvancedOptions {
  skim?: boolean;
  includePermissions?: boolean;
  includeCount?: boolean;
  populateAccess?: PopulateAccess;
  sq?: sqOptions;
}

export interface ReadOptions {
  includePermissions?: boolean;
  tryList?: boolean;
  sq?: sqOptions;
}

export interface ReadAdvancedArgs {
  select?: Projection;
  populate?: Populate[] | Populate | string;
}

export interface ReadAdvancedOptions {
  includePermissions?: boolean;
  tryList?: boolean;
  populateAccess?: PopulateAccess;
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
