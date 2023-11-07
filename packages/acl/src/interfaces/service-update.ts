import { Filter, Projection, Populate, PopulateAccess, Task } from './base';

export interface PublicUpdateArgs {
  select?: Projection;
  populate?: Populate[] | string;
  tasks?: Task | Task[];
}

export interface UpdateOneArgs extends Omit<PublicUpdateArgs, 'select' | 'tasks'> {
  overrides?: {
    filter?: Filter;
    populate?: Populate[] | string;
  };
}

export interface UpdateByIdArgs extends Omit<UpdateOneArgs, 'overrides'> {
  overrides?: {
    populate?: Populate[] | string;
    idFilter?: any;
  };
}

export interface PublicUpdateOptions {
  skim?: boolean;
  returningAll?: boolean;
  includePermissions?: boolean;
  populateAccess?: PopulateAccess;
}

export interface UpdateOneOptions extends Omit<PublicUpdateOptions, 'returningAll'> {}
export interface UpdateByIdOptions extends UpdateOneOptions {}
