import { Projection, Populate } from './base';

export interface PublicUpdateArgs {
  select?: Projection;
  populate?: Populate[] | string;
  process?: any;
}

export interface UpdateOneArgs extends Omit<PublicUpdateArgs, 'select' | 'process'> {
  overrides?: {
    query?: any;
    populate?: Populate[] | string;
  };
}

export interface UpdateByIdArgs extends Omit<UpdateOneArgs, 'overrides'> {
  overrides?: {
    populate?: Populate[] | string;
    idQuery?: any;
  };
}

export interface PublicUpdateOptions {
  returningAll?: boolean;
  includePermissions?: boolean;
  populateAccess?: string;
}

export interface UpdateOneOptions extends Omit<PublicUpdateOptions, 'returningAll'> {}
export interface UpdateByIdOptions extends UpdateOneOptions {}
