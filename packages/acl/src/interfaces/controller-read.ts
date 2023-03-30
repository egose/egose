import { Projection, Populate } from './base';

export interface PublicReadArgs {
  select?: Projection;
  populate?: Populate[] | string;
  process?: any;
}

export interface PublicReadOptions {
  populateAccess?: string;
  lean?: boolean;
  includePermissions?: boolean;
  tryList?: boolean;
}
