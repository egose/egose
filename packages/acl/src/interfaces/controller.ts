import { Projection, Populate } from './base';

export interface FindOptions {
  includePermissions?: boolean;
  populateAccess?: string;
  lean?: boolean;
}

export interface FindProps {
  query?: any;
  select?: Projection;
  populate?: Populate[] | string;
  sort?: string[] | string;
  limit?: string | number;
  page?: string | number;
  options?: FindOptions;
  overrides?: {
    query?: any;
    select?: Projection;
    populate?: Populate[] | string;
  };
  decorate?: Function;
}

export interface FindOneOptions {
  access?: string;
  populateAccess?: string;
  lean?: boolean;
  includePermissions?: boolean;
}

export interface FindOneProps {
  query?: any;
  select?: Projection;
  populate?: Populate[] | string;
  options?: FindOneOptions;
  overrides?: {
    query?: any;
    select?: Projection;
    populate?: Populate[] | string;
  };
}

export interface FindByIdProps {
  select?: Projection;
  populate?: Populate[] | string;
  options?: FindOneOptions;
  overrides?: {
    select?: Projection;
    populate?: Populate[] | string;
    idQuery?: any;
  };
}
