import { Projection, Populate } from './base';

export interface PublicListArgs {
  query?: any;
  select?: Projection;
  populate?: Populate[] | string;
  sort?: string[] | string;
  limit?: string | number;
  page?: string | number;
  process?: any;
}

export interface PublicListOptions {
  includePermissions?: boolean;
  includeCount?: boolean;
  populateAccess?: string;
  lean?: boolean;
}
