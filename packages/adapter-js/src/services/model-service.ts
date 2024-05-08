import get from 'lodash.get';
import set from 'lodash.set';
import noop from 'lodash.noop';
import { AxiosResponse, AxiosRequestConfig, AxiosInstance, mergeConfig } from 'axios';
import {
  FilterQuery,
  Projection,
  Populate,
  PopulateAccess,
  Document,
  Response,
  ModelResponse,
  ListModelResponse,
  wrapLazyPromise,
  ModelPromiseMeta,
  ResponseCallback,
} from '../types';

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
  AdditionalReqConfig,
} from '../interface';
import { CustomHeaders } from '../enums';

import { Model } from '../model';
import { Service, ServiceError, ResultError } from './service';
import { replaceSubQuery } from '../helpers';
import { CACHE_HEADER } from '../constants';

const setIfNotFound = (obj: object, key: string, value: any) => {
  if (!get(obj, key)) set(obj, key, value);
};

interface ListData<T> {
  count: number;
  rows: T[];
}

type RequestConfig = AxiosRequestConfig & AdditionalReqConfig;

interface Props {
  axios: AxiosInstance;
  modelName: string;
  basePath: string;
  queryPath: string;
  mutationPath: string;
  onSuccess: ResponseCallback;
  onFailure: ResponseCallback;
  suppressError: boolean;
}

export class ModelService<T extends Document> extends Service<T> {
  private _modelName!: string;
  private _queryPath!: string;
  private _mutationPath!: string;
  private _handleCallbacks!: <T extends { success: boolean }>(res: T, suppressError?: boolean) => T;
  private _defaults!: Defaults;

  constructor(
    { axios, modelName, basePath, queryPath, mutationPath, onSuccess, onFailure, suppressError }: Props,
    defaults?: Defaults,
  ) {
    super(axios, basePath);

    this._modelName = modelName;
    this._queryPath = queryPath;
    this._mutationPath = mutationPath;
    this._defaults = defaults ?? {};

    const _onSuccess = onSuccess ?? noop;
    const _onFailure = onFailure ?? noop;

    this._handleCallbacks = <T extends { success: boolean }>(res: T, _suppressError = suppressError) => {
      if (res.success) {
        _onSuccess(res);
        return res;
      }

      _onFailure(res);
      if (_suppressError) return res;
      throw new ServiceError(res as unknown as ResultError);
    };

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

  list(args?: ListArgs, options?: ListOptions, axiosRequestConfig?: RequestConfig) {
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
      includeExtraHeaders = this._defaults.listOptions.includeExtraHeaders ?? false,
      ignoreCache = this._defaults.listOptions.ignoreCache ?? false,
      sq,
    } = options ?? {};

    const { suppressError, ...reqConfig } = axiosRequestConfig ?? {};
    reqConfig.headers = this.updateHeaders(reqConfig.headers, { ignoreCache });

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
                include_extra_headers: includeExtraHeaders,
              },
            }),
          )
          .then(this.handleSuccess)
          .then((result: ListModelResponse<T>) => {
            return this.processListResult(this, result, { includeCount, includeExtraHeaders });
          })
          .catch(this.handleError<ListModelResponse<T>>)
          .then((res) => this._handleCallbacks<ListModelResponse<T>>(res, suppressError)),
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
            includeExtraHeaders,
          },
          sqOptions: sq,
        },
        __requestConfig: reqConfig,
        __service: this,
      },
    );

    return result;
  }

  listAdvanced(
    filter: FilterQuery<T>,
    args?: ListAdvancedArgs,
    options?: ListAdvancedOptions,
    axiosRequestConfig?: RequestConfig,
  ) {
    const {
      select = this._defaults.listAdvancedArgs.select,
      populate = this._defaults.listAdvancedArgs.populate,
      include = this._defaults.listAdvancedArgs.include,
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
      includeExtraHeaders = this._defaults.listAdvancedOptions.includeExtraHeaders ?? false,
      populateAccess = this._defaults.listAdvancedOptions.populateAccess,
      ignoreCache = this._defaults.listAdvancedOptions.ignoreCache ?? false,
      sq,
    } = options ?? {};

    const { suppressError, ...reqConfig } = axiosRequestConfig ?? {};
    reqConfig.headers = this.updateHeaders(reqConfig.headers, { ignoreCache });

    const result: ModelPromiseMeta & Promise<ListModelResponse<T>> = wrapLazyPromise<
      ListModelResponse<T>,
      ModelPromiseMeta
    >(
      () =>
        this._axios
          .post(
            `${this._basePath}/${this._queryPath}`,
            {
              filter: replaceSubQuery<T>(filter),
              select,
              sort,
              populate,
              include,
              skip,
              limit,
              page,
              pageSize,
              options: {
                skim,
                includePermissions,
                includeCount,
                includeExtraHeaders,
                populateAccess,
              },
            },
            reqConfig,
          )
          .then(this.handleSuccess)
          .then((result: ListModelResponse<T>) => {
            return this.processListResult(this, result, { includeCount, includeExtraHeaders });
          })
          .catch(this.handleError<ListModelResponse<T>>)
          .then((res) => this._handleCallbacks<ListModelResponse<T>>(res, suppressError)),
      {
        __op: 'listAdvanced',
        __query: {
          model: this._modelName,
          op: 'list',
          filter: {},
          args: { select, sort, populate, include, skip, limit, page, pageSize },
          options: {
            skim,
            includePermissions,
            includeCount,
            includeExtraHeaders,
            populateAccess,
          },
          sqOptions: sq,
        },
        __requestConfig: reqConfig,
        __service: this,
      },
    );

    return result;
  }

  read(identifier: string, options?: ReadOptions, axiosRequestConfig?: RequestConfig) {
    const {
      includePermissions = this._defaults.readOptions.includePermissions ?? true,
      tryList = this._defaults.readOptions.tryList ?? true,
      ignoreCache = this._defaults.readOptions.ignoreCache ?? false,
      sq,
    } = options ?? {};

    const { suppressError, ...reqConfig } = axiosRequestConfig ?? {};
    reqConfig.headers = this.updateHeaders(reqConfig.headers, { ignoreCache });

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
          .then((result: ModelResponse<T>) => {
            result.data = result.success ? Model.create<T>(result.raw, this) : null;
            return result;
          })
          .catch(this.handleError<ModelResponse<T>>)
          .then((res) => this._handleCallbacks<ModelResponse<T>>(res, suppressError)),
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
          sqOptions: sq,
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
    axiosRequestConfig?: RequestConfig,
  ) {
    const {
      select = this._defaults.readAdvancedArgs.select,
      populate = this._defaults.readAdvancedArgs.populate,
      include = this._defaults.readAdvancedArgs.include,
    } = args ?? {};

    const {
      includePermissions = this._defaults.readAdvancedOptions.includePermissions ?? true,
      tryList = this._defaults.readAdvancedOptions.tryList ?? true,
      populateAccess = this._defaults.readAdvancedOptions.populateAccess,
      ignoreCache = this._defaults.readAdvancedOptions.ignoreCache ?? false,
      sq,
    } = options ?? {};

    const { suppressError, ...reqConfig } = axiosRequestConfig ?? {};
    reqConfig.headers = this.updateHeaders(reqConfig.headers, { ignoreCache });

    const result: ModelPromiseMeta & Promise<ModelResponse<T>> = wrapLazyPromise<ModelResponse<T>, ModelPromiseMeta>(
      () =>
        this._axios
          .post(
            `${this._basePath}/${this._queryPath}/${identifier}`,
            {
              select,
              populate,
              include,
              options: {
                includePermissions,
                tryList,
                populateAccess,
              },
            },
            reqConfig,
          )
          .then(this.handleSuccess)
          .then((result: ModelResponse<T>) => {
            result.data = result.success ? Model.create<T>(result.raw, this) : null;
            return result;
          })
          .catch(this.handleError<ModelResponse<T>>)
          .then((res) => this._handleCallbacks<ModelResponse<T>>(res, suppressError)),
      {
        __op: 'readAdvanced',
        __query: {
          model: this._modelName,
          op: 'read',
          id: identifier,
          args: { select, populate, include },
          options: {
            includePermissions,
            tryList,
            populateAccess,
          },
          sqOptions: sq,
        },
        __requestConfig: reqConfig,
        __service: this,
      },
    );

    return result;
  }

  readAdvancedFilter(
    filter: FilterQuery<T>,
    args?: ReadAdvancedArgs,
    options?: ReadAdvancedOptions,
    axiosRequestConfig?: RequestConfig,
  ) {
    const {
      select = this._defaults.readAdvancedArgs.select,
      populate = this._defaults.readAdvancedArgs.populate,
      include = this._defaults.readAdvancedArgs.include,
    } = args ?? {};

    const {
      includePermissions = this._defaults.readAdvancedOptions.includePermissions ?? true,
      tryList = this._defaults.readAdvancedOptions.tryList ?? true,
      populateAccess = this._defaults.readAdvancedOptions.populateAccess,
      ignoreCache = this._defaults.readAdvancedOptions.ignoreCache ?? false,
      sq,
    } = options ?? {};

    const { suppressError, ...reqConfig } = axiosRequestConfig ?? {};
    reqConfig.headers = this.updateHeaders(reqConfig.headers, { ignoreCache });

    const result: ModelPromiseMeta & Promise<ModelResponse<T>> = wrapLazyPromise<ModelResponse<T>, ModelPromiseMeta>(
      () =>
        this._axios
          .post(
            `${this._basePath}/${this._queryPath}/__filter`,
            {
              filter: replaceSubQuery<T>(filter),
              select,
              populate,
              include,
              options: {
                includePermissions,
                tryList,
                populateAccess,
              },
            },
            reqConfig,
          )
          .then(this.handleSuccess)
          .then((result: ModelResponse<T>) => {
            result.data = result.success ? Model.create<T>(result.raw, this) : null;
            return result;
          })
          .catch(this.handleError<ModelResponse<T>>)
          .then((res) => this._handleCallbacks<ModelResponse<T>>(res, suppressError)),
      {
        __op: 'readAdvancedFilter',
        __query: {
          model: this._modelName,
          op: 'read',
          filter,
          args: { select, populate, include },
          options: {
            includePermissions,
            tryList,
            populateAccess,
          },
          sqOptions: sq,
        },
        __requestConfig: reqConfig,
        __service: this,
      },
    );

    return result;
  }

  new(axiosRequestConfig?: RequestConfig) {
    const { suppressError, ...reqConfig } = axiosRequestConfig ?? {};
    set(reqConfig, `headers.${CACHE_HEADER}`, 'false');

    const result: ModelPromiseMeta & Promise<ModelResponse<T>> = wrapLazyPromise<ModelResponse<T>, ModelPromiseMeta>(
      () =>
        this._axios
          .get(`${this._basePath}/new`, reqConfig)
          .then(this.handleSuccess)
          .then((result: ModelResponse<T>) => {
            delete result.raw._id;

            result.data = result.success ? Model.create<T>(result.raw, this) : null;
            return result;
          })
          .catch(this.handleError<ModelResponse<T>>)
          .then((res) => this._handleCallbacks<ModelResponse<T>>(res, suppressError)),
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

  create(data: object, options?: CreateOptions, axiosRequestConfig?: RequestConfig) {
    const { includePermissions = this._defaults.createOptions.includePermissions ?? true } = options ?? {};
    const { suppressError, ...reqConfig } = axiosRequestConfig ?? {};
    set(reqConfig, `headers.${CACHE_HEADER}`, 'false');

    const result: ModelPromiseMeta & Promise<ModelResponse<T>> = wrapLazyPromise<ModelResponse<T>, ModelPromiseMeta>(
      () =>
        this._axios
          .post(this._basePath, data, mergeConfig(reqConfig, { params: { include_permissions: includePermissions } }))
          .then(this.handleSuccess)
          .then((result: ModelResponse<T>) => {
            result.data = result.success ? Model.create<T>(result.raw, this) : null;
            return result;
          })
          .catch(this.handleError<ModelResponse<T>>)
          .then((res) => this._handleCallbacks<ModelResponse<T>>(res, suppressError)),
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
    axiosRequestConfig?: RequestConfig,
  ) {
    const { select = this._defaults.createAdvancedArgs.select, populate = this._defaults.createAdvancedArgs.populate } =
      args ?? {};

    const {
      includePermissions = this._defaults.createAdvancedOptions.includePermissions ?? true,
      populateAccess = this._defaults.createAdvancedOptions.populateAccess,
    } = options ?? {};

    const { suppressError, ...reqConfig } = axiosRequestConfig ?? {};
    set(reqConfig, `headers.${CACHE_HEADER}`, 'false');

    const result: ModelPromiseMeta & Promise<ModelResponse<T>> = wrapLazyPromise<ModelResponse<T>, ModelPromiseMeta>(
      () =>
        this._axios
          .post(
            `${this._basePath}/${this._mutationPath}`,
            { data, select, populate, options: { includePermissions, populateAccess } },
            reqConfig,
          )
          .then(this.handleSuccess)
          .then((result: ModelResponse<T>) => {
            result.data = result.success ? Model.create<T>(result.raw, this) : null;
            return result;
          })
          .catch(this.handleError<ModelResponse<T>>)
          .then((res) => this._handleCallbacks<ModelResponse<T>>(res, suppressError)),
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

  update(identifier: string, data: object, options?: UpdateOptions, axiosRequestConfig?: RequestConfig) {
    const { returningAll = this._defaults.updateOptions.returningAll ?? true } = options ?? {};
    const { suppressError, ...reqConfig } = axiosRequestConfig ?? {};
    set(reqConfig, `headers.${CACHE_HEADER}`, 'false');

    const result: ModelPromiseMeta & Promise<ModelResponse<T>> = wrapLazyPromise<ModelResponse<T>, ModelPromiseMeta>(
      () =>
        this._axios
          .patch(
            `${this._basePath}/${identifier}`,
            data,
            mergeConfig(reqConfig, { params: { returning_all: returningAll } }),
          )
          .then(this.handleSuccess)
          .then((result: ModelResponse<T>) => {
            result.data = result.success ? Model.create<T>(result.raw, this) : null;
            return result;
          })
          .catch(this.handleError<ModelResponse<T>>)
          .then((res) => this._handleCallbacks<ModelResponse<T>>(res, suppressError)),
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
    axiosRequestConfig?: RequestConfig,
  ) {
    const { select = this._defaults.updateAdvancedArgs.select, populate = this._defaults.updateAdvancedArgs.populate } =
      args ?? {};

    const {
      returningAll = this._defaults.updateAdvancedOptions.returningAll ?? true,
      includePermissions = this._defaults.updateAdvancedOptions.includePermissions ?? true,
      populateAccess = this._defaults.updateAdvancedOptions.populateAccess,
    } = options ?? {};

    const { suppressError, ...reqConfig } = axiosRequestConfig ?? {};
    set(reqConfig, `headers.${CACHE_HEADER}`, 'false');

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
          .then((result: ModelResponse<T>) => {
            result.data = result.success ? Model.create<T>(result.raw, this) : null;
            return result;
          })
          .catch(this.handleError<ModelResponse<T>>)
          .then((res) => this._handleCallbacks<ModelResponse<T>>(res, suppressError)),
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

  delete(identifier: string, axiosRequestConfig?: RequestConfig) {
    const { suppressError, ...reqConfig } = axiosRequestConfig ?? {};
    set(reqConfig, `headers.${CACHE_HEADER}`, 'false');

    const result: ModelPromiseMeta & Promise<Response<string>> = wrapLazyPromise<Response<string>, ModelPromiseMeta>(
      () =>
        this._axios
          .delete(`${this._basePath}/${identifier}`, reqConfig)
          .then(this.handleSuccess)
          .then((result: Response<string>) => {
            result.data = result.raw;
            return result;
          })
          .catch(this.handleError<Response<string>>)
          .then((res) => this._handleCallbacks<Response<string>>(res, suppressError)),
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

  distinct(field: string, axiosRequestConfig?: RequestConfig) {
    const { suppressError, ...reqConfig } = axiosRequestConfig ?? {};

    const result: ModelPromiseMeta & Promise<Response<string[]>> = wrapLazyPromise<
      Response<string[]>,
      ModelPromiseMeta
    >(
      () =>
        this._axios
          .get(`${this._basePath}/distinct/${field}`, reqConfig)
          .then(this.handleSuccess)
          .then((result: Response<string[]>) => {
            result.data = result.raw;
            return result;
          })
          .catch(this.handleError<Response<string[]>>)
          .then((res) => this._handleCallbacks<Response<string[]>>(res, suppressError)),
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

  distinctAdvanced(field: string, conditions: FilterQuery<T>, axiosRequestConfig?: RequestConfig) {
    const { suppressError, ...reqConfig } = axiosRequestConfig ?? {};

    const result: ModelPromiseMeta & Promise<Response<string[]>> = wrapLazyPromise<
      Response<string[]>,
      ModelPromiseMeta
    >(
      () =>
        this._axios
          .post(`${this._basePath}/distinct/${field}`, conditions, reqConfig)
          .then(this.handleSuccess)
          .then((result: Response<string[]>) => {
            result.data = result.raw;
            return result;
          })
          .catch(this.handleError<Response<string[]>>)
          .then((res) => this._handleCallbacks<Response<string[]>>(res, suppressError)),
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

  count(axiosRequestConfig?: RequestConfig) {
    const { suppressError, ...reqConfig } = axiosRequestConfig ?? {};

    const result: ModelPromiseMeta & Promise<Response<number>> = wrapLazyPromise<Response<number>, ModelPromiseMeta>(
      () =>
        this._axios
          .get(`${this._basePath}/count`, reqConfig)
          .then(this.handleSuccess)
          .then((result: Response<number>) => {
            result.data = result.raw;
            return result;
          })
          .catch(this.handleError<Response<number>>)
          .then((res) => this._handleCallbacks<Response<number>>(res, suppressError)),
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

  countAdvanced(filter: FilterQuery<T>, args?: { access?: string }, axiosRequestConfig?: RequestConfig) {
    const { access } = args ?? {};
    const { suppressError, ...reqConfig } = axiosRequestConfig ?? {};

    const result: ModelPromiseMeta & Promise<Response<number>> = wrapLazyPromise<Response<number>, ModelPromiseMeta>(
      () =>
        this._axios
          .post(`${this._basePath}/count`, { filter, access }, reqConfig)
          .then(this.handleSuccess)
          .then((result: Response<number>) => {
            result.data = result.raw;
            return result;
          })
          .catch(this.handleError<Response<number>>)
          .then((res) => this._handleCallbacks<Response<number>>(res, suppressError)),
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

  id(id: string) {
    return {
      subs: <S = T>(field: keyof T) => {
        const sub = String(field);
        return {
          list: (axiosRequestConfig?: RequestConfig) => {
            const { suppressError, ...reqConfig } = axiosRequestConfig ?? {};

            const result: ModelPromiseMeta & Promise<ListModelResponse<S>> = wrapLazyPromise<
              ListModelResponse<S>,
              ModelPromiseMeta
            >(
              () =>
                this._axios
                  .get(
                    `${this._basePath}/${id}/${sub}`,
                    mergeConfig(reqConfig, {
                      params: {},
                    }),
                  )
                  .then(this.handleSuccess)
                  .then((result: ListModelResponse<S>) => {
                    result.totalCount = Array.isArray(result.raw) ? result.raw.length : 0;
                    result.data = [];
                    return result;
                  })
                  .catch(this.handleError<ListModelResponse<S>>)
                  .then((res) => this._handleCallbacks<ListModelResponse<S>>(res, suppressError)),
              {
                __op: 'listSub',
                __query: {
                  model: this._modelName,
                  op: 'listsub',
                  id,
                  sub,
                  filter: {},
                  args: {},
                  options: {},
                },
                __requestConfig: reqConfig,
                __service: this,
              },
            );

            return result;
          },
          listAdvanced: (filter?: any, args?: { select: string[] }, axiosRequestConfig?: RequestConfig) => {
            const { select } = args ?? {};
            const { suppressError, ...reqConfig } = axiosRequestConfig ?? {};

            const result: ModelPromiseMeta & Promise<ListModelResponse<S>> = wrapLazyPromise<
              ListModelResponse<S>,
              ModelPromiseMeta
            >(
              () =>
                this._axios
                  .post(`${this._basePath}/${id}/${sub}/${this._queryPath}`, { filter, fields: select }, reqConfig)
                  .then(this.handleSuccess)
                  .then((result: ListModelResponse<S>) => {
                    result.totalCount = result.raw.length;
                    result.data = [];
                    return result;
                  })
                  .catch(this.handleError<ListModelResponse<S>>)
                  .then((res) => this._handleCallbacks<ListModelResponse<S>>(res, suppressError)),
              {
                __op: 'listAdvancedSub',
                __query: {
                  model: this._modelName,
                  op: 'listsub',
                  id,
                  sub,
                  filter,
                  args: { select },
                  options: {},
                },
                __requestConfig: reqConfig,
                __service: this,
              },
            );

            return result;
          },
          read: (subId: string, axiosRequestConfig?: RequestConfig) => {
            const { suppressError, ...reqConfig } = axiosRequestConfig ?? {};

            const result: ModelPromiseMeta & Promise<ModelResponse<S>> = wrapLazyPromise<
              ModelResponse<S>,
              ModelPromiseMeta
            >(
              () =>
                this._axios
                  .get(
                    `${this._basePath}/${id}/${sub}/${subId}`,
                    mergeConfig(reqConfig, {
                      params: {},
                    }),
                  )
                  .then(this.handleSuccess)
                  .then((result: ModelResponse<S>) => {
                    result.data = null;
                    return result;
                  })
                  .catch(this.handleError<ModelResponse<S>>)
                  .then((res) => this._handleCallbacks<ModelResponse<S>>(res, suppressError)),
              {
                __op: 'readSub',
                __query: {
                  model: this._modelName,
                  op: 'readsub',
                  id,
                  sub,
                  subId,
                  args: {},
                  options: {},
                },
                __requestConfig: reqConfig,
                __service: this,
              },
            );

            return result;
          },
          readAdvanced: (
            subId: string,
            args?: { select?: string[]; populate?: any },
            axiosRequestConfig?: RequestConfig,
          ) => {
            const { select, populate } = args ?? {};
            const { suppressError, ...reqConfig } = axiosRequestConfig ?? {};

            const result: ModelPromiseMeta & Promise<ModelResponse<S>> = wrapLazyPromise<
              ModelResponse<S>,
              ModelPromiseMeta
            >(
              () =>
                this._axios
                  .post(
                    `${this._basePath}/${id}/${sub}/${subId}/${this._queryPath}`,
                    {
                      fields: select,
                      populate,
                    },
                    reqConfig,
                  )
                  .then(this.handleSuccess)
                  .then((result: ModelResponse<S>) => {
                    result.data = null;
                    return result;
                  })
                  .catch(this.handleError<ModelResponse<S>>)
                  .then((res) => this._handleCallbacks<ModelResponse<S>>(res, suppressError)),
              {
                __op: 'readAdvancedSub',
                __query: {
                  model: this._modelName,
                  op: 'readsub',
                  id,
                  sub,
                  subId,
                  args: { select, populate },
                  options: {},
                },
                __requestConfig: reqConfig,
                __service: this,
              },
            );

            return result;
          },
          update: (
            subId: string,
            data: object,
            options?: { returningSub: boolean },
            axiosRequestConfig?: RequestConfig,
          ) => {
            const { returningSub } = options ?? {};
            const { suppressError, ...reqConfig } = axiosRequestConfig ?? {};

            const result: ModelPromiseMeta & Promise<ModelResponse<S>> = wrapLazyPromise<
              ModelResponse<S>,
              ModelPromiseMeta
            >(
              () =>
                this._axios
                  .patch(
                    `${this._basePath}/${id}/${sub}/${subId}`,
                    data,
                    mergeConfig(reqConfig, { params: { returning_sub: returningSub === true } }),
                  )
                  .then(this.handleSuccess)
                  .then((result: ModelResponse<S>) => {
                    result.data = null;
                    return result;
                  })
                  .catch(this.handleError<ModelResponse<S>>)
                  .then((res) => this._handleCallbacks<ModelResponse<S>>(res, suppressError)),
              {
                __op: 'updateSub',
                __query: {
                  model: this._modelName,
                  op: 'updatesub',
                  id,
                  sub,
                  subId,
                  data,
                  options: {
                    returningSub,
                  },
                },
                __requestConfig: reqConfig,
                __service: this,
              },
            );

            return result;
          },
          bulkUpdate: (data: object[], options?: {}, axiosRequestConfig?: RequestConfig) => {
            const {} = options ?? {};
            const { suppressError, ...reqConfig } = axiosRequestConfig ?? {};

            const result: ModelPromiseMeta & Promise<ListModelResponse<S>> = wrapLazyPromise<
              ListModelResponse<S>,
              ModelPromiseMeta
            >(
              () =>
                this._axios
                  .patch(`${this._basePath}/${id}/${sub}`, data, mergeConfig(reqConfig, { params: {} }))
                  .then(this.handleSuccess)
                  .then((result: ListModelResponse<S>) => {
                    result.data = [];
                    return result;
                  })
                  .catch(this.handleError<ListModelResponse<S>>)
                  .then((res) => this._handleCallbacks<ListModelResponse<S>>(res, suppressError)),
              {
                __op: 'bulkUpdateSub',
                __query: {
                  model: this._modelName,
                  op: 'bulkUpdatesub',
                  id,
                  sub,
                  data,
                  options: {},
                },
                __requestConfig: reqConfig,
                __service: this,
              },
            );

            return result;
          },
          create: (data: object, axiosRequestConfig?: RequestConfig) => {
            const { suppressError, ...reqConfig } = axiosRequestConfig ?? {};

            const result: ModelPromiseMeta & Promise<ModelResponse<S>> = wrapLazyPromise<
              ModelResponse<S>,
              ModelPromiseMeta
            >(
              () =>
                this._axios
                  .post(`${this._basePath}/${id}/${sub}`, data, mergeConfig(reqConfig, { params: {} }))
                  .then(this.handleSuccess)
                  .then((result: ModelResponse<S>) => {
                    result.data = null;
                    return result;
                  })
                  .catch(this.handleError<ModelResponse<S>>)
                  .then((res) => this._handleCallbacks<ModelResponse<S>>(res, suppressError)),
              {
                __op: 'createSub',
                __query: {
                  model: this._modelName,
                  op: 'createsub',
                  id,
                  sub,
                  data,
                  options: {},
                },
                __requestConfig: reqConfig,
                __service: this,
              },
            );

            return result;
          },
          delete: (subId: string, axiosRequestConfig?: RequestConfig) => {
            const { suppressError, ...reqConfig } = axiosRequestConfig ?? {};

            const result: ModelPromiseMeta & Promise<Response<string>> = wrapLazyPromise<
              Response<string>,
              ModelPromiseMeta
            >(
              () =>
                this._axios
                  .delete(`${this._basePath}/${id}/${sub}/${subId}`, reqConfig)
                  .then(this.handleSuccess)
                  .then((result: Response<string>) => {
                    result.data = null;
                    return result;
                  })
                  .catch(this.handleError<Response<string>>)
                  .then((res) => this._handleCallbacks<Response<string>>(res, suppressError)),
              {
                __op: 'deleteSub',
                __query: {
                  model: this._modelName,
                  op: 'deletesub',
                  id,
                  sub,
                  subId,
                },
                __requestConfig: reqConfig,
                __service: this,
              },
            );

            return result;
          },
        };
      },
      fetch: (args?: ReadAdvancedArgs, options?: ReadAdvancedOptions, axiosRequestConfig?: RequestConfig) => {
        return this.readAdvanced(id, args, options, axiosRequestConfig);
      },
    };
  }

  private processListResult<T>(
    _this: ModelService<T>,
    result: ListModelResponse<T>,
    { includeCount, includeExtraHeaders },
  ) {
    if (includeCount) {
      if (includeExtraHeaders) {
        const totalCount = get(result, `headers.${CustomHeaders.TotalCount}`, 0);
        result.totalCount = Number(totalCount);
      } else {
        result.totalCount = (result.raw as never as ListData<T>).count;
        result.raw = (result.raw as never as ListData<T>).rows;
      }
    }

    result.data = result.success ? result.raw.map((item) => Model.create<T>(item, _this)) : [];

    return result;
  }
}
