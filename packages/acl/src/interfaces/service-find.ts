import { Projection, Sort, Filter, Populate, PopulateAccess, FindAccess } from './base';

export interface FindArgs {
  select?: Projection;
  populate?: Populate[] | string;
  sort?: Sort;
  skip?: string | number;
  limit?: string | number;
  page?: string | number;
  pageSize?: string | number;
  overrides?: {
    filter?: Filter;
    select?: Projection;
    populate?: Populate[] | string;
  };
}

export interface FindOptions {
  skim?: boolean;
  includePermissions?: boolean;
  includeCount?: boolean;
  populateAccess?: PopulateAccess;
  lean?: boolean;
}

export interface FindOneArgs {
  select?: Projection;
  populate?: Populate[] | string;
  overrides?: {
    filter?: Filter;
    select?: Projection;
    populate?: Populate[] | string;
  };
}

export interface FindOneOptions {
  access?: FindAccess;
  populateAccess?: PopulateAccess;
  skim?: boolean;
  lean?: boolean;
  includePermissions?: boolean;
}

export interface FindByIdArgs {
  select?: Projection;
  populate?: Populate[] | string;
  overrides?: {
    select?: Projection;
    populate?: Populate[] | string;
    idFilter?: any;
  };
}

export interface FindByIdOptions extends FindOneOptions {}
