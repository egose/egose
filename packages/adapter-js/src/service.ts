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
  ModelPromise,
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
      lean?: boolean;
    },
    axiosRequestConfig?: AxiosRequestConfig,
  ) {
    const { skip, limit, page, pageSize } = args ?? {};
    const { includePermissions, includeCount, lean } = options ?? {};
    const reqConfig = axiosRequestConfig ?? {};

    const prom = new ModelPromise<ListModelResponse<T>>(async (resolve) => {
      const result: ListModelResponse<T> = await this._axios
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
              lean,
            },
          }),
        )
        .then(this.handleSuccess, this.handleError);

      const totalCount = get(result, 'headers.egose-total-count');
      if (totalCount) result.totalCount = Number(totalCount);

      result.data = result.success ? result.raw.map((item) => Model.create<T>(item, this)) : [];
      resolve(result);
    });

    prom.__op = 'list';
    prom.__query = {
      model: this._modelName,
      op: 'list',
      filter: {},
      args: { skip, limit, page, pageSize },
      options: {
        includePermissions,
        includeCount,
        includeExtraHeaders: false,
        lean,
      },
    };
    prom.__requestConfig = axiosRequestConfig;
    prom.__service = this;
    return prom;
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
      lean?: boolean;
    },
    axiosRequestConfig?: AxiosRequestConfig,
  ) {
    const { select, populate, sort, skip, limit, page, pageSize } = args ?? {};
    const { includePermissions, includeCount, populateAccess, lean } = options ?? {};
    const reqConfig = axiosRequestConfig ?? {};

    const prom = new ModelPromise<ListModelResponse<T>>(async (resolve) => {
      const result: ListModelResponse<T> = await this._axios
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
              lean,
            },
          },
          reqConfig,
        )
        .then(this.handleSuccess, this.handleError);

      const totalCount = get(result, 'headers.egose-total-count');
      if (totalCount) result.totalCount = Number(totalCount);

      result.data = result.success ? result.raw.map((item) => Model.create<T>(item, this)) : [];
      resolve(result);
    });

    prom.__op = 'listAdvanced';
    prom.__query = {
      model: this._modelName,
      op: 'list',
      filter: {},
      args: { select, sort, populate, skip, limit, page, pageSize },
      options: {
        includePermissions,
        includeCount,
        includeExtraHeaders: false,
        populateAccess,
        lean,
      },
    };
    prom.__requestConfig = axiosRequestConfig;
    prom.__service = this;
    return prom;
  }

  read(
    identifier: string,
    options?: {
      includePermissions?: boolean;
      tryList?: boolean;
      lean?: boolean;
    },
    axiosRequestConfig?: AxiosRequestConfig,
  ) {
    const { includePermissions, tryList, lean } = options ?? {};
    const reqConfig = axiosRequestConfig ?? {};

    const prom = new ModelPromise<ModelResponse<T>>(async (resolve) => {
      const result: ModelResponse<T> = await this._axios
        .get(
          `${this._basePath}/${identifier}`,
          mergeConfig(reqConfig, {
            params: {
              include_permissions: includePermissions,
              try_list: tryList,
              lean,
            },
          }),
        )
        .then(this.handleSuccess, this.handleError);

      result.data = result.success ? Model.create<T>(result.raw, this) : null;
      resolve(result);
    });

    prom.__op = 'read';
    prom.__query = {
      model: this._modelName,
      op: 'read',
      filter: {},
      args: {},
      options: {
        includePermissions,
        tryList,
        lean,
      },
    };
    prom.__requestConfig = axiosRequestConfig;
    prom.__service = this;
    return prom;
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
      lean?: boolean;
    },
    axiosRequestConfig?: AxiosRequestConfig,
  ) {
    const { select, populate } = args ?? {};
    const { includePermissions, tryList, populateAccess, lean } = options ?? {};
    const reqConfig = axiosRequestConfig ?? {};

    const prom = new ModelPromise<ModelResponse<T>>(async (resolve) => {
      const result: ModelResponse<T> = await this._axios
        .post(
          `${this._basePath}/${this._queryPath}/${identifier}`,
          {
            select,
            populate,
            options: {
              includePermissions,
              tryList,
              populateAccess,
              lean,
            },
          },
          reqConfig,
        )
        .then(this.handleSuccess, this.handleError);

      result.data = result.success ? Model.create<T>(result.raw, this) : null;
      resolve(result);
    });

    prom.__op = 'readAdvanced';
    prom.__query = {
      model: this._modelName,
      op: 'read',
      filter: {},
      args: { select, populate },
      options: {
        includePermissions,
        tryList,
        populateAccess,
        lean,
      },
    };
    prom.__requestConfig = axiosRequestConfig;
    prom.__service = this;
    return prom;
  }

  new(axiosRequestConfig?: AxiosRequestConfig) {
    const reqConfig = axiosRequestConfig ?? {};

    const prom = new ModelPromise<ModelResponse<T>>(async (resolve) => {
      const result: ModelResponse<T> = await this._axios
        .get(`${this._basePath}/new`, reqConfig)
        .then(this.handleSuccess, this.handleError);

      delete result.raw._id;

      result.data = result.success ? Model.create<T>(result.raw, this) : null;
      resolve(result);
    });

    prom.__op = 'new';
    prom.__query = {
      model: this._modelName,
      op: 'empty',
    };
    prom.__requestConfig = axiosRequestConfig;
    prom.__service = this;
    return prom;
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

    const prom = new ModelPromise<ModelResponse<T>>(async (resolve) => {
      const result: ModelResponse<T> = await this._axios
        .post(this._basePath, data, mergeConfig(reqConfig, { params: { include_permissions: includePermissions } }))
        .then(this.handleSuccess, this.handleError);

      result.data = result.success ? Model.create<T>(result.raw, this) : null;
      resolve(result);
    });

    prom.__op = 'create';
    prom.__query = {
      model: this._modelName,
      op: 'create',
      data,
      options: {
        includePermissions,
      },
    };
    prom.__requestConfig = axiosRequestConfig;
    prom.__service = this;
    return prom;
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

    const prom = new ModelPromise<ModelResponse<T>>(async (resolve) => {
      const result: ModelResponse<T> = await this._axios
        .post(
          `${this._basePath}/${this._mutationPath}`,
          { data, select, populate, options: { includePermissions, populateAccess } },
          reqConfig,
        )
        .then(this.handleSuccess, this.handleError);

      result.data = result.success ? Model.create<T>(result.raw, this) : null;
      resolve(result);
    });

    prom.__op = 'createAdvanced';
    prom.__query = {
      model: this._modelName,
      op: 'create',
      data,
      args: { select, populate },
      options: {
        includePermissions,
        populateAccess,
      },
    };
    prom.__requestConfig = axiosRequestConfig;
    prom.__service = this;
    return prom;
  }

  update(
    identifier: string,
    data: object,
    options?: { returningAll?: boolean },
    axiosRequestConfig?: AxiosRequestConfig,
  ) {
    const { returningAll } = options ?? {};
    const reqConfig = axiosRequestConfig ?? {};

    const prom = new ModelPromise<ModelResponse<T>>(async (resolve) => {
      const result: ModelResponse<T> = await this._axios
        .patch(
          `${this._basePath}/${identifier}`,
          data,
          mergeConfig(reqConfig, { params: { returning_all: returningAll } }),
        )
        .then(this.handleSuccess, this.handleError);

      result.data = result.success ? Model.create<T>(result.raw, this) : null;
      resolve(result);
    });

    prom.__op = 'update';
    prom.__query = {
      model: this._modelName,
      op: 'update',
      id: identifier,
      data,
      options: {
        returningAll,
      },
    };
    prom.__requestConfig = axiosRequestConfig;
    prom.__service = this;
    return prom;
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

    const prom = new ModelPromise<ModelResponse<T>>(async (resolve) => {
      const result: ModelResponse<T> = await this._axios
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
        .then(this.handleSuccess, this.handleError);

      result.data = result.success ? Model.create<T>(result.raw, this) : null;
      resolve(result);
    });

    prom.__op = 'updateAdvanced';
    prom.__query = {
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
    };
    prom.__requestConfig = axiosRequestConfig;
    prom.__service = this;
    return prom;
  }

  delete(identifier: string, axiosRequestConfig?: AxiosRequestConfig) {
    const reqConfig = axiosRequestConfig ?? {};

    const prom = new ModelPromise<Response<string>>(async (resolve) => {
      const result: Response<string> = await this._axios
        .delete(`${this._basePath}/${identifier}`, reqConfig)
        .then(this.handleSuccess, this.handleError);

      result.data = result.raw;
      resolve(result);
    });

    prom.__op = 'delete';
    prom.__query = {
      model: this._modelName,
      op: 'delete',
      id: identifier,
    };
    prom.__requestConfig = axiosRequestConfig;
    prom.__service = this;
    return prom;
  }

  distinct(field: string, axiosRequestConfig?: AxiosRequestConfig) {
    const reqConfig = axiosRequestConfig ?? {};

    const prom = new ModelPromise<Response<string[]>>(async (resolve) => {
      const result: Response<string[]> = await this._axios
        .get(`${this._basePath}/distinct/${field}`, reqConfig)
        .then(this.handleSuccess, this.handleError);

      result.data = result.raw;
      resolve(result);
    });

    prom.__op = 'distinct';
    prom.__query = {
      model: this._modelName,
      op: 'distinct',
      field,
    };
    prom.__requestConfig = axiosRequestConfig;
    prom.__service = this;
    return prom;
  }

  distinctAdvanced(field: string, conditions: object, axiosRequestConfig?: AxiosRequestConfig) {
    const reqConfig = axiosRequestConfig ?? {};

    const prom = new ModelPromise<Response<string[]>>(async (resolve) => {
      const result: Response<string[]> = await this._axios
        .post(`${this._basePath}/distinct/${field}`, conditions, reqConfig)
        .then(this.handleSuccess, this.handleError);

      result.data = result.raw;
      resolve(result);
    });

    prom.__op = 'distinctAdvanced';
    prom.__query = {
      model: this._modelName,
      op: 'distinct',
      field,
      filter: conditions,
    };
    prom.__requestConfig = axiosRequestConfig;
    prom.__service = this;
    return prom;
  }

  count(axiosRequestConfig?: AxiosRequestConfig) {
    const reqConfig = axiosRequestConfig ?? {};

    const prom = new ModelPromise<Response<number>>(async (resolve) => {
      const result: Response<number> = await this._axios
        .get(`${this._basePath}/count`, reqConfig)
        .then(this.handleSuccess, this.handleError);

      result.data = result.raw;
      resolve(result);
    });

    prom.__op = 'count';
    prom.__query = {
      model: this._modelName,
      op: 'count',
    };
    prom.__requestConfig = axiosRequestConfig;
    prom.__service = this;
    return prom;
  }

  countAdvanced(filter: any, args?: { access?: string }, axiosRequestConfig?: AxiosRequestConfig) {
    const { access } = args ?? {};
    const reqConfig = axiosRequestConfig ?? {};

    const prom = new ModelPromise<Response<number>>(async (resolve) => {
      const result: Response<number> = await this._axios
        .post(`${this._basePath}/count`, { filter, access }, reqConfig)
        .then(this.handleSuccess, this.handleError);

      result.data = result.raw;
      resolve(result);
    });

    prom.__op = 'countAdvanced';
    prom.__query = {
      model: this._modelName,
      op: 'count',
      filter,
    };
    prom.__requestConfig = axiosRequestConfig;
    prom.__service = this;
    return prom;
  }

  private handleSuccess(res: AxiosResponse<any, any>) {
    return { success: true, raw: res.data, status: res.status, headers: res.headers } as Response<any, any>;
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
