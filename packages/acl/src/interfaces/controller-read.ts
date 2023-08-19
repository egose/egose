import { Projection, Populate, PopulateAccess } from './base';

export interface PublicReadArgs {
  select?: Projection;
  populate?: Populate[] | string;
  process?: any;
}

export interface PublicReadOptions {
  skim?: boolean;
  populateAccess?: PopulateAccess;
  lean?: boolean;
  includePermissions?: boolean;
  tryList?: boolean;
}
