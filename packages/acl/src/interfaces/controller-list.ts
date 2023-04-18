import { Projection, Populate } from './base';

export interface PublicListArgs {
  select?: Projection;
  populate?: Populate[] | string;
  sort?: string[] | string;
  skip?: string | number;
  limit?: string | number;
  page?: string | number;
  pageSize?: string | number;
  process?: any;
}

export interface PublicListOptions {
  includePermissions?: boolean;
  includeCount?: boolean;
  populateAccess?: string;
  lean?: boolean;
}
