import { Include, Projection, Sort, Populate, PopulateAccess, Task } from './base';

export interface PublicListArgs {
  select?: Projection;
  populate?: Populate[] | string;
  include?: Include | Include[];
  sort?: Sort;
  skip?: string | number;
  limit?: string | number;
  page?: string | number;
  pageSize?: string | number;
  tasks?: Task | Task[];
}

export interface PublicListOptions {
  skim?: boolean;
  includePermissions?: boolean;
  includeCount?: boolean;
  populateAccess?: PopulateAccess;
  lean?: boolean;
}
