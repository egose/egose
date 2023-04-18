import { Projection, Populate } from './base';

export interface FindArgs {
  filter?: any;
  select?: Projection;
  populate?: Populate[] | string;
  sort?: string[] | string;
  skip?: string | number;
  limit?: string | number;
  page?: string | number;
  pageSize?: string | number;
  overrides?: {
    filter?: any;
    select?: Projection;
    populate?: Populate[] | string;
  };
}

export interface FindOptions {
  includePermissions?: boolean;
  includeCount?: boolean;
  populateAccess?: string;
  lean?: boolean;
}

export interface FindOneArgs {
  select?: Projection;
  populate?: Populate[] | string;
  overrides?: {
    filter?: any;
    select?: Projection;
    populate?: Populate[] | string;
  };
}

export interface FindOneOptions {
  access?: string;
  populateAccess?: string;
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
