import { Projection, Populate } from './base';

export interface PublicUpdateArgs {
  select?: Projection;
  populate?: Populate[] | string;
  process?: any;
}

export interface UpdateArgs extends Omit<PublicUpdateArgs, 'select' | 'process'> {}

export interface PublicUpdateOptions {
  returningAll?: boolean;
  includePermissions?: boolean;
  populateAccess?: string;
}

export interface UpdateOptions extends Omit<PublicUpdateOptions, 'returningAll'> {}
