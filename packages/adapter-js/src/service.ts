import get from 'lodash/get';
import { AxiosResponse, AxiosRequestConfig, AxiosInstance, mergeConfig } from 'axios';
import { Projection, Populate, PopulateAccess, Document } from './types';
import { Model } from './model';

interface Props {
  axios: AxiosInstance;
  basePath: string;
  queryPath: string;
  mutationPath: string;
}

interface Response<T1, T2 = T1> {
  success: boolean;
  raw?: T1;
  data?: T2;
  message?: string;
  status?: number;
  headers?: Record<string, string>;
}

export class ModelService<T extends Document> {
  private _axios!: AxiosInstance;
  private _basePath!: string;
  private _queryPath!: string;
  private _mutationPath!: string;

  constructor({ axios, basePath, queryPath, mutationPath }: Props) {
    this._axios = axios;
    this._basePath = basePath;
    this._queryPath = queryPath;
    this._mutationPath = mutationPath;
  }

  async list(
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

    const result: Response<T[], (Model<T> & T)[]> & { totalCount?: number } = await this._axios
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

    result.data = result.success ? result.raw.map((item) => new Model<T>(item, this) as Model<T> & T) : [];

    return result;
  }

  async listAdvanced(
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

    const result: Response<T[], (Model<T> & T)[]> & { totalCount?: number } = await this._axios
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

    result.data = result.success ? result.raw.map((item) => new Model<T>(item, this) as Model<T> & T) : [];

    return result;
  }

  async read(
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

    const result: Response<T, Model<T> & T> = await this._axios
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

    result.data = result.success ? (new Model<T>(result.raw, this) as Model<T> & T) : null;
    return result;
  }

  async readAdvanced(
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

    const result: Response<T, Model<T> & T> = await this._axios
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

    result.data = result.success ? (new Model<T>(result.raw, this) as Model<T> & T) : null;
    return result;
  }

  async new(axiosRequestConfig?: AxiosRequestConfig) {
    const reqConfig = axiosRequestConfig ?? {};

    const result: Response<T, Model<T> & T> = await this._axios
      .get(`${this._basePath}/new`, reqConfig)
      .then(this.handleSuccess, this.handleError);

    delete result.raw._id;

    result.data = result.success ? (new Model<T>(result.raw, this) as Model<T> & T) : null;
    return result;
  }

  async create(
    data: object,
    options?: {
      includePermissions?: boolean;
    },
    axiosRequestConfig?: AxiosRequestConfig,
  ) {
    const { includePermissions } = options ?? {};
    const reqConfig = axiosRequestConfig ?? {};

    const result: Response<T, Model<T> & T> = await this._axios
      .post(this._basePath, data, mergeConfig(reqConfig, { params: { include_permissions: includePermissions } }))
      .then(this.handleSuccess, this.handleError);

    result.data = result.success ? (new Model<T>(result.raw, this) as Model<T> & T) : null;
    return result;
  }

  async createAdvanced(
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

    const result: Response<T, Model<T> & T> = await this._axios
      .post(
        `${this._basePath}/${this._mutationPath}`,
        { data, select, populate, options: { includePermissions, populateAccess } },
        reqConfig,
      )
      .then(this.handleSuccess, this.handleError);

    result.data = result.success ? (new Model<T>(result.raw, this) as Model<T> & T) : null;
    return result;
  }

  async update(
    identifier: string,
    data: object,
    options?: { returningAll?: boolean },
    axiosRequestConfig?: AxiosRequestConfig,
  ) {
    const { returningAll } = options ?? {};
    const reqConfig = axiosRequestConfig ?? {};

    const result: Response<T, Model<T> & T> = await this._axios
      .patch(
        `${this._basePath}/${identifier}`,
        data,
        mergeConfig(reqConfig, { params: { returning_all: returningAll } }),
      )
      .then(this.handleSuccess, this.handleError);

    result.data = result.success ? (new Model<T>(result.raw, this) as Model<T> & T) : null;
    return result;
  }

  async updateAdvanced(
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

    const result: Response<T, Model<T> & T> = await this._axios
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

    result.data = result.success ? (new Model<T>(result.raw, this) as Model<T> & T) : null;
    return result;
  }

  async delete(identifier: string, axiosRequestConfig?: AxiosRequestConfig) {
    const reqConfig = axiosRequestConfig ?? {};
    const result: Response<string> = await this._axios
      .delete(`${this._basePath}/${identifier}`, reqConfig)
      .then(this.handleSuccess, this.handleError);

    result.data = result.raw;
    return result;
  }

  async distinct(field: string, axiosRequestConfig?: AxiosRequestConfig) {
    const reqConfig = axiosRequestConfig ?? {};
    const result: Response<string[]> = await this._axios
      .get(`${this._basePath}/distinct/${field}`, reqConfig)
      .then(this.handleSuccess, this.handleError);

    result.data = result.raw;
    return result;
  }

  async distinctAdvanced(field: string, conditions: object, axiosRequestConfig?: AxiosRequestConfig) {
    const reqConfig = axiosRequestConfig ?? {};
    const result: Response<string[]> = await this._axios
      .post(`${this._basePath}/distinct/${field}`, conditions, reqConfig)
      .then(this.handleSuccess, this.handleError);

    result.data = result.raw;
    return result;
  }

  async count(axiosRequestConfig?: AxiosRequestConfig) {
    const reqConfig = axiosRequestConfig ?? {};
    const result: Response<number> = await this._axios
      .get(`${this._basePath}/count`, reqConfig)
      .then(this.handleSuccess, this.handleError);

    result.data = result.raw;
    return result;
  }

  async countAdvanced(filter: any, args?: { access?: string }, axiosRequestConfig?: AxiosRequestConfig) {
    const { access } = args ?? {};
    const reqConfig = axiosRequestConfig ?? {};
    const result: Response<number> = await this._axios
      .post(`${this._basePath}/count`, { filter, access }, reqConfig)
      .then(this.handleSuccess, this.handleError);

    result.data = result.raw;
    return result;
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
