import { Projection, Populate } from './base';

export interface FindArgs {
  query?: any;
  select?: Projection;
  populate?: Populate[] | string;
  sort?: string[] | string;
  limit?: string | number;
  page?: string | number;
  overrides?: {
    query?: any;
    select?: Projection;
    populate?: Populate[] | string;
  };
}

export interface FindOptions {
  includePermissions?: boolean;
  populateAccess?: string;
  lean?: boolean;
}

export interface FindOneArgs {
  query?: any;
  select?: Projection;
  populate?: Populate[] | string;
  overrides?: {
    query?: any;
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
    idQuery?: any;
  };
}

export interface FindByIdOptions extends FindOneOptions {}
