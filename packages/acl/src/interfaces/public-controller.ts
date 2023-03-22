import { Projection, Populate } from './base';

export interface ListOptions {
  includePermissions?: boolean;
  includeCount?: boolean;
  populateAccess?: string;
  lean?: boolean;
}

export interface ListProps {
  query?: any;
  select?: Projection;
  populate?: Populate[] | string;
  sort?: string[] | string;
  limit?: string | number;
  page?: string | number;
  process?: any;
  options?: ListOptions;
}

export interface ReadOptions {
  populateAccess?: string;
  lean?: boolean;
  includePermissions?: boolean;
  tryList?: boolean;
}

export interface ReadProps {
  select?: Projection;
  populate?: Populate[] | string;
  process?: any;
  options?: ReadOptions;
}

export interface CreateOptions {
  includePermissions?: boolean;
}

export interface UpdateOptions {
  returningAll?: boolean;
}

export interface DistinctOptions {
  query?: any;
}
