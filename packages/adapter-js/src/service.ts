import get from 'lodash/get';
import { AxiosResponse, AxiosRequestConfig, AxiosInstance, mergeConfig } from 'axios';
import {
  Projection,
  Populate,
  PopulateAccess,
  Document,
  Response,
  ModelResponse,
  ListModelResponse,
  wrapLazyPromise,
  ModelPromiseMeta,
} from './types';
import { Model } from './model';

interface Props {
  axios: AxiosInstance;
  modelName: string;
  basePath: string;
  queryPath: string;
  mutationPath: string;
}

export class ModelService<T extends Document> {
  private _axios!: AxiosInstance;
  private _modelName!: string;
  private _basePath!: string;
  private _queryPath!: string;
  private _mutationPath!: string;

  constructor({ axios, modelName, basePath, queryPath, mutationPath }: Props) {
    this._axios = axios;
    this._modelName = modelName;
    this._basePath = basePath;
    this._queryPath = queryPath;
    this._mutationPath = mutationPath;
  }

  list(
    args?: {
      skip?: number;
      limit?: number;
      page?: number;
      pageSize?: number;
    },
    options?: {
      includePermissions?: boolean;
      includeCount?: boolean;
    },
    axiosRequestConfig?: AxiosRequestConfig,
  ) {
    const { skip, limit, page, pageSize } = args ?? {};
    const { includePermissions, includeCount } = options ?? {};
    const reqConfig = axiosRequestConfig ?? {};

    const result: ModelPromiseMeta & Promise<ListModelResponse<T>> = wrapLazyPromise<
      ListModelResponse<T>,
      ModelPromiseMeta
    >(
      () =>
        this._axios
          .get(
            this._basePath,
            mergeConfig(reqConfig, {
              params: {
                skip,
                limit,
                page,
                page_size: pageSize,
                include_permissions: includePermissions,
                include_count: includeCount,
                include_extra_headers: 'true',
              },
            }),
          )
          .then(this.handleSuccess)
          .then((result: ListModelResponse<T>) => {
            const totalCount = get(result, 'headers.egose-total-count');
            if (totalCount) result.totalCount = Number(totalCount);

            result.data = result.success ? result.raw.map((item) => Model.create<T>(item, this)) : [];
            return result;
          })
          .catch(this.handleError),
      {
        __op: 'list',
        __query: {
          model: this._modelName,
          op: 'list',
          filter: {},
          args: { skip, limit, page, pageSize },
          options: {
            includePermissions,
            includeCount,
            includeExtraHeaders: false,
          },
        },
        __requestConfig: reqConfig,
        __service: this,
      },
    );

    return result;
  }

  listAdvanced(
    filter: any,
    args?: {
      select?: Projection;
      populate?: Populate[] | Populate | string;
      sort?: string[] | string;
      skip?: string | number;
      limit?: string | number;
      page?: string | number;
      pageSize?: string | number;
    },
    options?: {
      includePermissions?: boolean;
      includeCount?: boolean;
      populateAccess?: PopulateAccess;
    },
    axiosRequestConfig?: AxiosRequestConfig,
  ) {
    const { select, populate, sort, skip, limit, page, pageSize } = args ?? {};
    const { includePermissions, includeCount, populateAccess } = options ?? {};
    const reqConfig = axiosRequestConfig ?? {};

    const result: ModelPromiseMeta & Promise<ListModelResponse<T>> = wrapLazyPromise<
      ListModelResponse<T>,
      ModelPromiseMeta
    >(
      () =>
        this._axios
          .post(
            `${this._basePath}/${this._queryPath}`,
            {
              filter,
              select,
              sort,
              populate,
              skip,
              limit,
              page,
              pageSize,
              options: {
                includePermissions,
                includeCount,
                includeExtraHeaders: true,
                populateAccess,
              },
            },
            reqConfig,
          )
          .then(this.handleSuccess)
          .then((result: ListModelResponse<T>) => {
            const totalCount = get(result, 'headers.egose-total-count');
            if (totalCount) result.totalCount = Number(totalCount);

            result.data = result.success ? result.raw.map((item) => Model.create<T>(item, this)) : [];
            return result;
          })
          .catch(this.handleError),
      {
        __op: 'listAdvanced',
        __query: {
          model: this._modelName,
          op: 'list',
          filter: {},
          args: { select, sort, populate, skip, limit, page, pageSize },
          options: {
            includePermissions,
            includeCount,
            includeExtraHeaders: false,
            populateAccess,
          },
        },
        __requestConfig: reqConfig,
        __service: this,
      },
    );

    return result;
  }

  read(
    identifier: string,
    options?: {
      includePermissions?: boolean;
      tryList?: boolean;
    },
    axiosRequestConfig?: AxiosRequestConfig,
  ) {
    const { includePermissions, tryList } = options ?? {};
    const reqConfig = axiosRequestConfig ?? {};

    const result: ModelPromiseMeta & Promise<ModelResponse<T>> = wrapLazyPromise<ModelResponse<T>, ModelPromiseMeta>(
      () =>
        this._axios
          .get(
            `${this._basePath}/${identifier}`,
            mergeConfig(reqConfig, {
              params: {
                include_permissions: includePermissions,
                try_list: tryList,
              },
            }),
          )
          .then(this.handleSuccess)
          .then((result) => {
            result.data = result.success ? Model.create<T>(result.raw, this) : null;
            return result;
          })
          .catch(this.handleError),
      {
        __op: 'read',
        __query: {
          model: this._modelName,
          op: 'read',
          filter: {},
          args: {},
          options: {
            includePermissions,
            tryList,
          },
        },
        __requestConfig: reqConfig,
        __service: this,
      },
    );

    return result;
  }

  readAdvanced(
    identifier: string,
    args?: {
      select?: Projection;
      populate?: Populate[] | Populate | string;
    },
    options?: {
      includePermissions?: boolean;
      tryList?: boolean;
      populateAccess?: PopulateAccess;
    },
    axiosRequestConfig?: AxiosRequestConfig,
  ) {
    const { select, populate } = args ?? {};
    const { includePermissions, tryList, populateAccess } = options ?? {};
    const reqConfig = axiosRequestConfig ?? {};

    const result: ModelPromiseMeta & Promise<ModelResponse<T>> = wrapLazyPromise<ModelResponse<T>, ModelPromiseMeta>(
      () =>
        this._axios
          .post(
            `${this._basePath}/${this._queryPath}/${identifier}`,
            {
              select,
              populate,
              options: {
                includePermissions,
                tryList,
                populateAccess,
              },
            },
            reqConfig,
          )
          .then(this.handleSuccess)
          .then((result) => {
            result.data = result.success ? Model.create<T>(result.raw, this) : null;
            return result;
          })
          .catch(this.handleError),
      {
        __op: 'readAdvanced',
        __query: {
          model: this._modelName,
          op: 'read',
          filter: {},
          args: { select, populate },
          options: {
            includePermissions,
            tryList,
            populateAccess,
          },
        },
        __requestConfig: reqConfig,
        __service: this,
      },
    );

    return result;
  }

  new(axiosRequestConfig?: AxiosRequestConfig) {
    const reqConfig = axiosRequestConfig ?? {};

    const result: ModelPromiseMeta & Promise<ModelResponse<T>> = wrapLazyPromise<ModelResponse<T>, ModelPromiseMeta>(
      () =>
        this._axios
          .get(`${this._basePath}/new`, reqConfig)
          .then(this.handleSuccess)
          .then((result) => {
            delete result.raw._id;

            result.data = result.success ? Model.create<T>(result.raw, this) : null;
            return result;
          })
          .catch(this.handleError),
      {
        __op: 'new',
        __query: {
          model: this._modelName,
          op: 'new',
        },
        __requestConfig: reqConfig,
        __service: this,
      },
    );

    return result;
  }

  create(
    data: object,
    options?: {
      includePermissions?: boolean;
    },
    axiosRequestConfig?: AxiosRequestConfig,
  ) {
    const { includePermissions } = options ?? {};
    const reqConfig = axiosRequestConfig ?? {};

    const result: ModelPromiseMeta & Promise<ModelResponse<T>> = wrapLazyPromise<ModelResponse<T>, ModelPromiseMeta>(
      () =>
        this._axios
          .post(this._basePath, data, mergeConfig(reqConfig, { params: { include_permissions: includePermissions } }))
          .then(this.handleSuccess)
          .then((result) => {
            result.data = result.success ? Model.create<T>(result.raw, this) : null;
            return result;
          })
          .catch(this.handleError),
      {
        __op: 'create',
        __query: {
          model: this._modelName,
          op: 'create',
          data,
          options: {
            includePermissions,
          },
        },
        __requestConfig: reqConfig,
        __service: this,
      },
    );

    return result;
  }

  createAdvanced(
    data: object,
    args?: {
      select?: Projection;
      populate?: Populate[] | Populate | string;
    },
    options?: {
      includePermissions?: boolean;
      populateAccess?: PopulateAccess;
    },
    axiosRequestConfig?: AxiosRequestConfig,
  ) {
    const { select, populate } = args ?? {};
    const { includePermissions, populateAccess } = options ?? {};
    const reqConfig = axiosRequestConfig ?? {};

    const result: ModelPromiseMeta & Promise<ModelResponse<T>> = wrapLazyPromise<ModelResponse<T>, ModelPromiseMeta>(
      () =>
        this._axios
          .post(
            `${this._basePath}/${this._mutationPath}`,
            { data, select, populate, options: { includePermissions, populateAccess } },
            reqConfig,
          )
          .then(this.handleSuccess)
          .then((result) => {
            result.data = result.success ? Model.create<T>(result.raw, this) : null;
            return result;
          })
          .catch(this.handleError),
      {
        __op: 'createAdvanced',
        __query: {
          model: this._modelName,
          op: 'create',
          data,
          args: { select, populate },
          options: {
            includePermissions,
            populateAccess,
          },
        },
        __requestConfig: reqConfig,
        __service: this,
      },
    );

    return result;
  }

  update(
    identifier: string,
    data: object,
    options?: { returningAll?: boolean },
    axiosRequestConfig?: AxiosRequestConfig,
  ) {
    const { returningAll } = options ?? {};
    const reqConfig = axiosRequestConfig ?? {};

    const result: ModelPromiseMeta & Promise<ModelResponse<T>> = wrapLazyPromise<ModelResponse<T>, ModelPromiseMeta>(
      () =>
        this._axios
          .patch(
            `${this._basePath}/${identifier}`,
            data,
            mergeConfig(reqConfig, { params: { returning_all: returningAll } }),
          )
          .then(this.handleSuccess)
          .then((result) => {
            result.data = result.success ? Model.create<T>(result.raw, this) : null;
            return result;
          })
          .catch(this.handleError),
      {
        __op: 'update',
        __query: {
          model: this._modelName,
          op: 'update',
          id: identifier,
          data,
          options: {
            returningAll,
          },
        },
        __requestConfig: reqConfig,
        __service: this,
      },
    );

    return result;
  }

  updateAdvanced(
    identifier: string,
    data: object,
    args?: {
      select?: Projection;
      populate?: Populate[] | Populate | string;
    },
    options?: {
      returningAll?: boolean;
      includePermissions?: boolean;
      populateAccess?: PopulateAccess;
    },
    axiosRequestConfig?: AxiosRequestConfig,
  ) {
    const { select, populate } = args ?? {};
    const { returningAll, includePermissions, populateAccess } = options ?? {};
    const reqConfig = axiosRequestConfig ?? {};

    const result: ModelPromiseMeta & Promise<ModelResponse<T>> = wrapLazyPromise<ModelResponse<T>, ModelPromiseMeta>(
      () =>
        this._axios
          .patch(
            `${this._basePath}/${this._mutationPath}/${identifier}`,
            {
              data,
              select,
              populate,
              options: { returningAll, includePermissions, populateAccess },
            },
            reqConfig,
          )
          .then(this.handleSuccess)
          .then((result) => {
            result.data = result.success ? Model.create<T>(result.raw, this) : null;
            return result;
          })
          .catch(this.handleError),
      {
        __op: 'updateAdvanced',
        __query: {
          model: this._modelName,
          op: 'update',
          id: identifier,
          data,
          args: { select, populate },
          options: {
            returningAll,
            includePermissions,
            populateAccess,
          },
        },
        __requestConfig: reqConfig,
        __service: this,
      },
    );

    return result;
  }

  delete(identifier: string, axiosRequestConfig?: AxiosRequestConfig) {
    const reqConfig = axiosRequestConfig ?? {};

    const result: ModelPromiseMeta & Promise<Response<string>> = wrapLazyPromise<Response<string>, ModelPromiseMeta>(
      () =>
        this._axios
          .delete(`${this._basePath}/${identifier}`, reqConfig)
          .then(this.handleSuccess)
          .then((result) => {
            result.data = result.raw;
            return result;
          })
          .catch(this.handleError),
      {
        __op: 'delete',
        __query: {
          model: this._modelName,
          op: 'delete',
          id: identifier,
        },
        __requestConfig: reqConfig,
        __service: this,
      },
    );

    return result;
  }

  distinct(field: string, axiosRequestConfig?: AxiosRequestConfig) {
    const reqConfig = axiosRequestConfig ?? {};

    const result: ModelPromiseMeta & Promise<Response<string[]>> = wrapLazyPromise<
      Response<string[]>,
      ModelPromiseMeta
    >(
      () =>
        this._axios
          .get(`${this._basePath}/distinct/${field}`, reqConfig)
          .then(this.handleSuccess)
          .then((result) => {
            result.data = result.raw;
            return result;
          })
          .catch(this.handleError),
      {
        __op: 'distinct',
        __query: {
          model: this._modelName,
          op: 'distinct',
          field,
        },
        __requestConfig: reqConfig,
        __service: this,
      },
    );

    return result;
  }

  distinctAdvanced(field: string, conditions: object, axiosRequestConfig?: AxiosRequestConfig) {
    const reqConfig = axiosRequestConfig ?? {};

    const result: ModelPromiseMeta & Promise<Response<string[]>> = wrapLazyPromise<
      Response<string[]>,
      ModelPromiseMeta
    >(
      () =>
        this._axios
          .post(`${this._basePath}/distinct/${field}`, conditions, reqConfig)
          .then(this.handleSuccess)
          .then((result) => {
            result.data = result.raw;
            return result;
          })
          .catch(this.handleError),
      {
        __op: 'distinctAdvanced',
        __query: {
          model: this._modelName,
          op: 'distinct',
          field,
          filter: conditions,
        },
        __requestConfig: reqConfig,
        __service: this,
      },
    );

    return result;
  }

  count(axiosRequestConfig?: AxiosRequestConfig) {
    const reqConfig = axiosRequestConfig ?? {};

    const result: ModelPromiseMeta & Promise<Response<number>> = wrapLazyPromise<Response<number>, ModelPromiseMeta>(
      () =>
        this._axios
          .get(`${this._basePath}/count`, reqConfig)
          .then(this.handleSuccess)
          .then((result) => {
            result.data = result.raw;
            return result;
          })
          .catch(this.handleError),
      {
        __op: 'count',
        __query: {
          model: this._modelName,
          op: 'count',
        },
        __requestConfig: reqConfig,
        __service: this,
      },
    );

    return result;
  }

  countAdvanced(filter: any, args?: { access?: string }, axiosRequestConfig?: AxiosRequestConfig) {
    const { access } = args ?? {};
    const reqConfig = axiosRequestConfig ?? {};

    const result: ModelPromiseMeta & Promise<Response<number>> = wrapLazyPromise<Response<number>, ModelPromiseMeta>(
      () =>
        this._axios
          .post(`${this._basePath}/count`, { filter, access }, reqConfig)
          .then(this.handleSuccess)
          .then((result) => {
            result.data = result.raw;
            return result;
          })
          .catch(this.handleError),
      {
        __op: 'countAdvanced',
        __query: {
          model: this._modelName,
          op: 'count',
          filter,
        },
        __requestConfig: reqConfig,
        __service: this,
      },
    );

    return result;
  }

  private handleSuccess(res: AxiosResponse<any, any>, extra = {}) {
    return { success: true, raw: res.data, status: res.status, headers: res.headers, ...extra } as Response<any, any>;
  }

  // See https://axios-http.com/docs/handling_errors
  private handleError(error) {
    const result: Response<any, any> = {
      success: false,
    };

    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      result.status = error.response.status;
      result.headers = error.response.headers;
      result.message = error.response.data.message ?? error.response.data;
    } else if (error.request) {
      // The request was made but no response was received
      // `error.request` is an instance of XMLHttpRequest in the browser and an instance of
      // http.ClientRequest in node.js
      result.message = 'The server is not responding';
    } else {
      // Something happened in setting up the request that triggered an Error
      result.message = error.message;
    }

    return result;
  }
}
