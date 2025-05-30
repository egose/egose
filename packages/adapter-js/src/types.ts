import { AxiosRequestConfig } from 'axios';
import { Model } from './model';
import { ModelService, DataService } from './services';
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
  model: string;
  op: 'list' | 'read' | 'count';
  path: string;
  localField: string;
  foreignField: string;
  filter?: FilterQuery<any>;
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

export type ModelResponse<T, TData extends Partial<T> = T> = Response<TData, Model<T, TData> & TData>;
export type ArrayModelResponse<T, TData extends Partial<T> = T> = Response<TData[], (Model<T, TData> & TData)[]>;
export type ListModelResponse<T, TData extends Partial<T> = T> = ArrayModelResponse<T, TData> & { totalCount: number };

export interface ModelPromiseMeta {
  __op: string;
  __query: {
    model: string;
    op: string;
    id?: string;
    sub?: string;
    subId?: string;
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

export type DataResponse<T> = Response<T, T>;
export type ArrayDataResponse<T> = Response<T[], T[]>;
export type ListDataResponse<T> = ArrayDataResponse<T> & { totalCount: number };

export interface DataPromiseMeta {
  __op: string;
  __query: {
    name: string;
    op: string;
    id?: string;
    filter?: any;
    data?: any;
    args?: any;
    options?: any;
  };
  __requestConfig?: AxiosRequestConfig;
  __service?: DataService<any>;
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

export type ResponseCallback = <R>(res: R) => void;

export interface WrapOptions {
  queryParams?: { [key: string]: any };
  pathParams?: { [key: string]: any };
}
