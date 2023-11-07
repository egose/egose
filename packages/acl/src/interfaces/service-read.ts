import { Projection, Populate, Include, PopulateAccess, Task } from './base';

export interface PublicReadArgs {
  select?: Projection;
  populate?: Populate[] | string;
  include?: Include | Include[];
  tasks?: Task | Task[];
}

export interface PublicReadOptions {
  skim?: boolean;
  populateAccess?: PopulateAccess;
  lean?: boolean;
  includePermissions?: boolean;
  tryList?: boolean;
}
