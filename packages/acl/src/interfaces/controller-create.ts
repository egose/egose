import { Projection, Populate, PopulateAccess } from './base';

export interface PublicCreateArgs {
  select?: Projection;
  populate?: Populate[] | string;
  process?: any;
}

export interface CreateArgs extends Omit<PublicCreateArgs, 'select' | 'process'> {}

export interface PublicCreateOptions {
  skim?: boolean;
  includePermissions?: boolean;
  populateAccess?: PopulateAccess;
}

export interface CreateOptions extends PublicCreateOptions {}
