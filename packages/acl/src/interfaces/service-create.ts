import { Projection, Populate, PopulateAccess, Task } from './base';

export interface PublicCreateArgs {
  select?: Projection;
  populate?: Populate[] | string;
  tasks?: Task | Task[];
}

export interface CreateArgs extends Omit<PublicCreateArgs, 'select' | 'tasks'> {}

export interface PublicCreateOptions {
  skim?: boolean;
  includePermissions?: boolean;
  populateAccess?: PopulateAccess;
}

export interface CreateOptions extends PublicCreateOptions {}
