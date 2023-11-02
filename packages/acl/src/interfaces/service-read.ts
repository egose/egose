import { Projection, Populate, Include, PopulateAccess } from './base';

export interface PublicReadArgs {
  select?: Projection;
  populate?: Populate[] | string;
  include?: Include | Include[];
  process?: any;
}

export interface PublicReadOptions {
  skim?: boolean;
  populateAccess?: PopulateAccess;
  lean?: boolean;
  includePermissions?: boolean;
  tryList?: boolean;
}
