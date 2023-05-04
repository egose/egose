export interface KeyValueProjection {
  [key: string]: 1 | -1;
}

export type Projection = string[] | string | KeyValueProjection;

export type PopulateAccess = 'list' | 'read';

export interface Populate {
  path: string;
  select?: Projection;
  match?: any;
  access?: PopulateAccess;
}

export interface Document {
  _id?: string;
}
