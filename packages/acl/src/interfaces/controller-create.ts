import { Projection, Populate } from './base';

export interface PublicCreateArgs {
  select?: Projection;
  populate?: Populate[] | string;
  process?: any;
}

export interface CreateArgs extends Omit<PublicCreateArgs, 'select' | 'process'> {}

export interface PublicCreateOptions {
  includePermissions?: boolean;
  populateAccess?: string;
}

export interface CreateOptions extends PublicCreateOptions {}
