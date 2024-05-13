import get from 'lodash.get';
import set from 'lodash.set';
import noop from 'lodash.noop';
import { AxiosResponse, AxiosRequestConfig, AxiosInstance, mergeConfig } from 'axios';
import {
  FilterQuery,
  Document,
  Response,
  DataResponse,
  ListDataResponse,
  wrapLazyPromise,
  DataPromiseMeta,
  ResponseCallback,
} from '../types';

import {
  DataListArgs,
  DataListOptions,
  DataListAdvancedArgs,
  DataListAdvancedOptions,
  DataReadOptions,
  DataReadAdvancedArgs,
  DataReadAdvancedOptions,
  DataDefaults,
  AdditionalReqConfig,
} from '../interface';
import { CustomHeaders } from '../enums';

import { Service, ServiceError, ResultError } from './service';
import { replaceSubQuery } from '../helpers';

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
  dataName: string;
  basePath: string;
  queryPath: string;
  onSuccess: ResponseCallback;
  onFailure: ResponseCallback;
  throwOnError: boolean;
}

export class DataService<T> extends Service<T> {
  private _dataName!: string;
  private _queryPath!: string;
  private _handleCallbacks!: <T extends { success: boolean }>(res: T, throwOnError?: boolean) => T;
  private _defaults!: DataDefaults;

  constructor(
    { axios, dataName, basePath, queryPath, onSuccess, onFailure, throwOnError }: Props,
    defaults?: DataDefaults,
  ) {
    super(axios, basePath);

    this._dataName = dataName;
    this._queryPath = queryPath;
    this._defaults = defaults ?? {};

    const _onSuccess = onSuccess ?? noop;
    const _onFailure = onFailure ?? noop;
    this._handleCallbacks = <T extends { success: boolean }>(res: T, _throwOnError = throwOnError) => {
      if (res.success) {
        _onSuccess(res);
        return res;
      }

      _onFailure(res);
      if (_throwOnError) {
        throw new ServiceError(res as unknown as ResultError);
      }
      return res;
    };

    [
      'listArgs',
      'listOptions',
      'listAdvancedArgs',
      'listAdvancedOptions',
      'readOptions',
      'readAdvancedArgs',
      'readAdvancedOptions',
    ].forEach((key) => setIfNotFound(this._defaults, key, {}));
  }

  list(args?: DataListArgs, options?: DataListOptions, axiosRequestConfig?: RequestConfig) {
    const {
      skip = this._defaults.listArgs.skip,
      limit = this._defaults.listArgs.limit,
      page = this._defaults.listArgs.page,
      pageSize = this._defaults.listArgs.pageSize,
    } = args ?? {};

    const {
      includePermissions = this._defaults.listOptions.includePermissions ?? false,
      includeCount = this._defaults.listOptions.includeCount ?? false,
      includeExtraHeaders = this._defaults.listOptions.includeExtraHeaders ?? false,
      ignoreCache = this._defaults.listOptions.ignoreCache ?? false,
    } = options ?? {};

    const { throwOnError, ...reqConfig } = axiosRequestConfig ?? {};
    reqConfig.headers = this.updateHeaders(reqConfig.headers, { ignoreCache });

    const result: DataPromiseMeta & Promise<ListDataResponse<T>> = wrapLazyPromise<
      ListDataResponse<T>,
      DataPromiseMeta
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
                include_extra_headers: includeExtraHeaders,
              },
            }),
          )
          .then(this.handleSuccess)
          .then((result: ListDataResponse<T>) => {
            return this.processListResult(result, { includeCount, includeExtraHeaders });
          })
          .catch(this.handleError<ListDataResponse<T>>)
          .then((res) => this._handleCallbacks<ListDataResponse<T>>(res, throwOnError)),
      {
        __op: 'list',
        __query: {
          name: this._dataName,
          op: 'list',
          filter: {},
          args: { skip, limit, page, pageSize },
          options: {
            includePermissions,
            includeCount,
            includeExtraHeaders,
          },
        },
        __requestConfig: reqConfig,
        __service: this,
      },
    );

    return result;
  }

  listAdvanced(
    filter: FilterQuery<T>,
    args?: DataListAdvancedArgs,
    options?: DataListAdvancedOptions,
    axiosRequestConfig?: RequestConfig,
  ) {
    const {
      select = this._defaults.listAdvancedArgs.select,
      sort = this._defaults.listAdvancedArgs.sort,
      skip = this._defaults.listAdvancedArgs.skip,
      limit = this._defaults.listAdvancedArgs.limit,
      page = this._defaults.listAdvancedArgs.page,
      pageSize = this._defaults.listAdvancedArgs.pageSize,
    } = args ?? {};

    const {
      includePermissions = this._defaults.listAdvancedOptions.includePermissions ?? false,
      includeCount = this._defaults.listAdvancedOptions.includeCount ?? false,
      includeExtraHeaders = this._defaults.listAdvancedOptions.includeExtraHeaders ?? false,
      ignoreCache = this._defaults.listAdvancedOptions.ignoreCache ?? false,
    } = options ?? {};

    const { throwOnError, ...reqConfig } = axiosRequestConfig ?? {};
    reqConfig.headers = this.updateHeaders(reqConfig.headers, { ignoreCache });

    const result: DataPromiseMeta & Promise<ListDataResponse<T>> = wrapLazyPromise<
      ListDataResponse<T>,
      DataPromiseMeta
    >(
      () =>
        this._axios
          .post(
            `${this._basePath}/${this._queryPath}`,
            {
              filter: replaceSubQuery<T>(filter),
              select,
              sort,
              skip,
              limit,
              page,
              pageSize,
              options: {
                includePermissions,
                includeCount,
                includeExtraHeaders,
              },
            },
            reqConfig,
          )
          .then(this.handleSuccess)
          .then((result: ListDataResponse<T>) => {
            return this.processListResult(result, { includeCount, includeExtraHeaders });
          })
          .catch(this.handleError<ListDataResponse<T>>)
          .then((res) => this._handleCallbacks<ListDataResponse<T>>(res, throwOnError)),
      {
        __op: 'listAdvanced',
        __query: {
          name: this._dataName,
          op: 'list',
          filter: {},
          args: { select, sort, skip, limit, page, pageSize },
          options: {
            includePermissions,
            includeCount,
            includeExtraHeaders,
          },
        },
        __requestConfig: reqConfig,
        __service: this,
      },
    );

    return result;
  }

  read(identifier: string, options?: DataReadOptions, axiosRequestConfig?: RequestConfig) {
    const {
      includePermissions = this._defaults.readOptions.includePermissions ?? true,
      ignoreCache = this._defaults.readOptions.ignoreCache ?? false,
    } = options ?? {};

    const { throwOnError, ...reqConfig } = axiosRequestConfig ?? {};
    reqConfig.headers = this.updateHeaders(reqConfig.headers, { ignoreCache });

    const result: DataPromiseMeta & Promise<DataResponse<T>> = wrapLazyPromise<DataResponse<T>, DataPromiseMeta>(
      () =>
        this._axios
          .get(
            `${this._basePath}/${identifier}`,
            mergeConfig(reqConfig, {
              params: {
                include_permissions: includePermissions,
              },
            }),
          )
          .then(this.handleSuccess)
          .then((result: DataResponse<T>) => {
            result.data = result.raw;
            return result;
          })
          .catch(this.handleError<DataResponse<T>>)
          .then((res) => this._handleCallbacks<DataResponse<T>>(res, throwOnError)),
      {
        __op: 'read',
        __query: {
          name: this._dataName,
          op: 'read',
          id: identifier,
          args: {},
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

  readAdvanced(
    identifier: string,
    args?: DataReadAdvancedArgs,
    options?: DataReadAdvancedOptions,
    axiosRequestConfig?: RequestConfig,
  ) {
    const {
      select = this._defaults.readAdvancedArgs.select,
      ignoreCache = this._defaults.readAdvancedArgs.ignoreCache ?? false,
    } = args ?? {};

    const { includePermissions = this._defaults.readAdvancedOptions.includePermissions ?? true } = options ?? {};

    const { throwOnError, ...reqConfig } = axiosRequestConfig ?? {};
    reqConfig.headers = this.updateHeaders(reqConfig.headers, { ignoreCache });

    const result: DataPromiseMeta & Promise<DataResponse<T>> = wrapLazyPromise<DataResponse<T>, DataPromiseMeta>(
      () =>
        this._axios
          .post(
            `${this._basePath}/${this._queryPath}/${identifier}`,
            {
              select,
              options: {
                includePermissions,
              },
            },
            reqConfig,
          )
          .then(this.handleSuccess)
          .then((result: DataResponse<T>) => {
            result.data = result.raw;
            return result;
          })
          .catch(this.handleError<DataResponse<T>>)
          .then((res) => this._handleCallbacks<DataResponse<T>>(res, throwOnError)),
      {
        __op: 'readAdvanced',
        __query: {
          name: this._dataName,
          op: 'read',
          id: identifier,
          args: { select },
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

  readAdvancedFilter(
    filter: FilterQuery<T>,
    args?: DataReadAdvancedArgs,
    options?: DataReadAdvancedOptions,
    axiosRequestConfig?: RequestConfig,
  ) {
    const { select = this._defaults.readAdvancedArgs.select } = args ?? {};

    const {
      includePermissions = this._defaults.readAdvancedOptions.includePermissions ?? true,
      ignoreCache = this._defaults.readAdvancedOptions.ignoreCache ?? false,
    } = options ?? {};

    const { throwOnError, ...reqConfig } = axiosRequestConfig ?? {};
    reqConfig.headers = this.updateHeaders(reqConfig.headers, { ignoreCache });

    const result: DataPromiseMeta & Promise<DataResponse<T>> = wrapLazyPromise<DataResponse<T>, DataPromiseMeta>(
      () =>
        this._axios
          .post(
            `${this._basePath}/${this._queryPath}/__filter`,
            {
              filter: replaceSubQuery<T>(filter),
              select,
              options: {
                includePermissions,
              },
            },
            reqConfig,
          )
          .then(this.handleSuccess)
          .then((result: DataResponse<T>) => {
            result.data = result.raw;
            return result;
          })
          .catch(this.handleError<DataResponse<T>>)
          .then((res) => this._handleCallbacks<DataResponse<T>>(res, throwOnError)),
      {
        __op: 'readAdvancedFilter',
        __query: {
          name: this._dataName,
          op: 'read',
          filter,
          args: { select },
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

  private processListResult<T>(result: ListDataResponse<T>, { includeCount, includeExtraHeaders }) {
    if (includeCount) {
      if (includeExtraHeaders) {
        const totalCount = get(result, `headers.${CustomHeaders.TotalCount}`, 0);
        result.totalCount = Number(totalCount);
      } else {
        result.totalCount = (result.raw as never as ListData<T>).count;
        result.raw = (result.raw as never as ListData<T>).rows;
      }
    }

    result.data = result.raw;
    return result;
  }
}
