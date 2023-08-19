import { Projection, Populate, PopulateAccess } from './base';

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
  skim?: boolean;
  includePermissions?: boolean;
  includeCount?: boolean;
  populateAccess?: PopulateAccess;
  lean?: boolean;
}
