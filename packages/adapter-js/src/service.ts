import get from 'lodash/get';
import set from 'lodash/set';
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

import {
  ListArgs,
  ListOptions,
  ListAdvancedArgs,
  ListAdvancedOptions,
  ReadOptions,
  ReadAdvancedArgs,
  ReadAdvancedOptions,
  CreateOptions,
  CreateAdvancedArgs,
  CreateAdvancedOptions,
  UpdateOptions,
  UpdateAdvancedArgs,
  UpdateAdvancedOptions,
  Defaults,
} from './interface';

import { Model } from './model';

const setIfNotFound = (obj: object, key: string, value: any) => {
  if (!get(obj, key)) set(obj, key, value);
};

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
  private _defaults!: Defaults;

  constructor({ axios, modelName, basePath, queryPath, mutationPath }: Props, defaults?: Defaults) {
    this._axios = axios;
    this._modelName = modelName;
    this._basePath = basePath;
    this._queryPath = queryPath;
    this._mutationPath = mutationPath;
    this._defaults = defaults ?? {};

    [
      'listArgs',
      'listOptions',
      'listAdvancedArgs',
      'listAdvancedOptions',
      'readOptions',
      'readAdvancedArgs',
      'readAdvancedOptions',
      'createOptions',
      'createAdvancedArgs',
      'createAdvancedOptions',
      'updateOptions',
      'updateAdvancedArgs',
      'updateAdvancedOptions',
    ].forEach((key) => setIfNotFound(this._defaults, key, {}));
  }

  list(args?: ListArgs, options?: ListOptions, axiosRequestConfig?: AxiosRequestConfig) {
    const {
      skip = this._defaults.listArgs.skip,
      limit = this._defaults.listArgs.limit,
      page = this._defaults.listArgs.page,
      pageSize = this._defaults.listArgs.pageSize,
    } = args ?? {};

    const {
      skim = this._defaults.listOptions.skim ?? true,
      includePermissions = this._defaults.listOptions.includePermissions ?? false,
      includeCount = this._defaults.listOptions.includeCount ?? false,
    } = options ?? {};

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
                skim,
                include_permissions: includePermissions,
                include_count: includeCount,
                include_extra_headers: 'true',
              },
            }),
          )
          .then(this.handleSuccess)
          .then((result: ListModelResponse<T>) => {
            const totalCount = get(result, 'headers.egose-total-count', 0);
            result.totalCount = Number(totalCount);

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
            skim,
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
    args?: ListAdvancedArgs,
    options?: ListAdvancedOptions,
    axiosRequestConfig?: AxiosRequestConfig,
  ) {
    const {
      select = this._defaults.listAdvancedArgs.select,
      populate = this._defaults.listAdvancedArgs.populate,
      sort = this._defaults.listAdvancedArgs.sort,
      skip = this._defaults.listAdvancedArgs.skip,
      limit = this._defaults.listAdvancedArgs.limit,
      page = this._defaults.listAdvancedArgs.page,
      pageSize = this._defaults.listAdvancedArgs.pageSize,
    } = args ?? {};

    const {
      skim = this._defaults.listAdvancedOptions.skim ?? true,
      includePermissions = this._defaults.listAdvancedOptions.includePermissions ?? false,
      includeCount = this._defaults.listAdvancedOptions.includeCount ?? false,
      populateAccess = this._defaults.listAdvancedOptions.populateAccess,
    } = options ?? {};

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
                skim,
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
            const totalCount = get(result, 'headers.egose-total-count', 0);
            result.totalCount = Number(totalCount);

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
            skim,
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

  read(identifier: string, options?: ReadOptions, axiosRequestConfig?: AxiosRequestConfig) {
    const {
      includePermissions = this._defaults.readOptions.includePermissions ?? true,
      tryList = this._defaults.readOptions.tryList ?? true,
    } = options ?? {};

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
          id: identifier,
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
    args?: ReadAdvancedArgs,
    options?: ReadAdvancedOptions,
    axiosRequestConfig?: AxiosRequestConfig,
  ) {
    const { select = this._defaults.readAdvancedArgs.select, populate = this._defaults.readAdvancedArgs.populate } =
      args ?? {};

    const {
      includePermissions = this._defaults.readAdvancedOptions.includePermissions ?? true,
      tryList = this._defaults.readAdvancedOptions.tryList ?? true,
      populateAccess = this._defaults.readAdvancedOptions.populateAccess,
    } = options ?? {};

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
          id: identifier,
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

  readAdvancedFilter(
    filter: any,
    args?: ReadAdvancedArgs,
    options?: ReadAdvancedOptions,
    axiosRequestConfig?: AxiosRequestConfig,
  ) {
    const { select = this._defaults.readAdvancedArgs.select, populate = this._defaults.readAdvancedArgs.populate } =
      args ?? {};

    const {
      includePermissions = this._defaults.readAdvancedOptions.includePermissions ?? true,
      tryList = this._defaults.readAdvancedOptions.tryList ?? true,
      populateAccess = this._defaults.readAdvancedOptions.populateAccess,
    } = options ?? {};

    const reqConfig = axiosRequestConfig ?? {};

    const result: ModelPromiseMeta & Promise<ModelResponse<T>> = wrapLazyPromise<ModelResponse<T>, ModelPromiseMeta>(
      () =>
        this._axios
          .post(
            `${this._basePath}/${this._queryPath}/__filter`,
            {
              filter,
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
        __op: 'readAdvancedFilter',
        __query: {
          model: this._modelName,
          op: 'read',
          filter,
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

  create(data: object, options?: CreateOptions, axiosRequestConfig?: AxiosRequestConfig) {
    const { includePermissions = this._defaults.createOptions.includePermissions ?? true } = options ?? {};
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
    args?: CreateAdvancedArgs,
    options?: CreateAdvancedOptions,
    axiosRequestConfig?: AxiosRequestConfig,
  ) {
    const { select = this._defaults.createAdvancedArgs.select, populate = this._defaults.createAdvancedArgs.populate } =
      args ?? {};

    const {
      includePermissions = this._defaults.createAdvancedOptions.includePermissions ?? true,
      populateAccess = this._defaults.createAdvancedOptions.populateAccess,
    } = options ?? {};

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

  update(identifier: string, data: object, options?: UpdateOptions, axiosRequestConfig?: AxiosRequestConfig) {
    const { returningAll = this._defaults.updateOptions.returningAll ?? true } = options ?? {};
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
    args?: UpdateAdvancedArgs,
    options?: UpdateAdvancedOptions,
    axiosRequestConfig?: AxiosRequestConfig,
  ) {
    const { select = this._defaults.updateAdvancedArgs.select, populate = this._defaults.updateAdvancedArgs.populate } =
      args ?? {};

    const {
      returningAll = this._defaults.updateAdvancedOptions.returningAll ?? true,
      includePermissions = this._defaults.updateAdvancedOptions.includePermissions ?? true,
      populateAccess = this._defaults.updateAdvancedOptions.populateAccess,
    } = options ?? {};

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
      raw: null,
      data: null,
      message: null,
      status: null,
      headers: null,
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
