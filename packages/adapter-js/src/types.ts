import { AxiosRequestConfig } from 'axios';
import { Model } from './model';
import { ModelService } from './service';
import { sqOptions } from './interface';
import { _FilterQuery } from './mongoose/types';

export interface KeyValueProjection {
  [key: string]: 1 | -1;
}

export type Projection = string[] | string | KeyValueProjection;

export type SortOrder = -1 | 1 | 'asc' | 'ascending' | 'desc' | 'descending';

export type Sort = string | { [key: string]: SortOrder } | [string, SortOrder][] | undefined | null;

export type FilterQuery<T> = _FilterQuery<T>;

export interface Include {
  ref: string;
  op: 'list' | 'read';
  path: string;
  localField: string;
  foreignField: string;
  args?: any;
  options?: any;
}

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

export interface Response<T1, T2 = T1> {
  success: boolean;
  raw: T1;
  data: T2;
  message: string;
  status: number;
  headers: Record<string, string>;
}

export type ModelResponse<T> = Response<T, Model<T> & T>;
export type ArrayModelResponse<T> = Response<T[], (Model<T> & T)[]>;
export type ListModelResponse<T> = ArrayModelResponse<T> & { totalCount?: number };

export interface ModelPromiseMeta {
  __op: string;
  __query: {
    model: string;
    op: string;
    id?: string;
    field?: string;
    filter?: any;
    data?: any;
    args?: any;
    options?: any;
    sqOptions?: sqOptions;
  };
  __requestConfig?: AxiosRequestConfig;
  __service?: ModelService<any>;
}

export const wrapLazyPromise = <T, M = undefined>(promiseFn: () => Promise<T>, meta?: M): M & Promise<T> => {
  let isThenCalled = false;

  const prom = {
    then(onFulfilled: any, onRejected?: any) {
      isThenCalled = true;
      return promiseFn().then(onFulfilled, onRejected);
    },
    finally(onFinally: any) {
      if (isThenCalled) {
        return Promise.resolve().then(onFinally);
      }
      return Promise.resolve();
    },
    [Symbol.for('nodejs.util.inspect.custom')]() {
      // This method can be added for better console output in Node.js
      return 'LazyPromise';
    },
  };

  Object.defineProperty(prom, Symbol.toStringTag, {
    value: 'Promise',
    writable: false,
    enumerable: false,
    configurable: true,
  });

  Object.assign(prom, meta);

  return prom as M & Promise<T>;
};
