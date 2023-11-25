import { AxiosResponse, AxiosRequestConfig, AxiosInstance, mergeConfig } from 'axios';
import set from 'lodash/set';
import { Response, WrapOptions } from '../types';
import { CACHE_HEADER } from '../constants';
import { getWrapContext } from '../helpers';

const removeTrailingSlash = (inputString) => inputString.replace(/\/$/, '');
const removeLeadingSlash = (inputString) => inputString.replace(/^\/+/g, '');

export class Service<T> {
  protected _axios!: AxiosInstance;
  protected _basePath!: string;

  constructor(axios: AxiosInstance, basePath: string) {
    this._axios = axios;
    this._basePath = basePath;
  }

  protected handleSuccess(res: AxiosResponse<any, any>, extra = {}) {
    // console.table(res.headers);
    return { success: true, raw: res.data, status: res.status, headers: res.headers, ...extra } as Response<any, any>;
  }

  // See https://axios-http.com/docs/handling_errors
  protected handleError<T>(error) {
    const result: any = {
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

    return result as T;
  }

  wrapGet<T = any>(url: string, defaultAxiosRequestConfig: AxiosRequestConfig = {}) {
    const _url = `${removeTrailingSlash(this._basePath)}/${removeLeadingSlash(url)}`;
    set(defaultAxiosRequestConfig, `headers.${CACHE_HEADER}`, 'true');
    return (options?: WrapOptions, axiosRequestConfig?: AxiosRequestConfig) => {
      const { finalUrl, finalConfig } = getWrapContext(
        _url,
        options,
        mergeConfig(defaultAxiosRequestConfig, axiosRequestConfig),
      );

      return this._axios.get<T>(finalUrl, finalConfig);
    };
  }

  wrapPost<T = any>(url: string, defaultAxiosRequestConfig: AxiosRequestConfig = {}) {
    const _url = `${removeTrailingSlash(this._basePath)}/${removeLeadingSlash(url)}`;
    set(defaultAxiosRequestConfig, `headers.${CACHE_HEADER}`, 'false');
    return (data?: any, options?: WrapOptions, axiosRequestConfig?: AxiosRequestConfig) => {
      const { finalUrl, finalConfig } = getWrapContext(
        _url,
        options,
        mergeConfig(defaultAxiosRequestConfig, axiosRequestConfig),
      );

      return this._axios.post<T>(finalUrl, data, finalConfig);
    };
  }

  wrapPut<T = any>(url: string, defaultAxiosRequestConfig: AxiosRequestConfig = {}) {
    const _url = `${removeTrailingSlash(this._basePath)}/${removeLeadingSlash(url)}`;
    set(defaultAxiosRequestConfig, `headers.${CACHE_HEADER}`, 'false');
    return (data?: any, options?: WrapOptions, axiosRequestConfig?: AxiosRequestConfig) => {
      const { finalUrl, finalConfig } = getWrapContext(
        _url,
        options,
        mergeConfig(defaultAxiosRequestConfig, axiosRequestConfig),
      );

      return this._axios.put<T>(finalUrl, data, finalConfig);
    };
  }

  wrapPatch<T = any>(url: string, defaultAxiosRequestConfig: AxiosRequestConfig = {}) {
    const _url = `${removeTrailingSlash(this._basePath)}/${removeLeadingSlash(url)}`;
    set(defaultAxiosRequestConfig, `headers.${CACHE_HEADER}`, 'false');
    return (data?: any, options?: WrapOptions, axiosRequestConfig?: AxiosRequestConfig) => {
      const { finalUrl, finalConfig } = getWrapContext(
        _url,
        options,
        mergeConfig(defaultAxiosRequestConfig, axiosRequestConfig),
      );

      return this._axios.patch<T>(finalUrl, data, finalConfig);
    };
  }

  wrapDelete<T = any>(url: string, defaultAxiosRequestConfig: AxiosRequestConfig = {}) {
    const _url = `${removeTrailingSlash(this._basePath)}/${removeLeadingSlash(url)}`;
    set(defaultAxiosRequestConfig, `headers.${CACHE_HEADER}`, 'false');
    return (options?: WrapOptions, axiosRequestConfig?: AxiosRequestConfig) => {
      const { finalUrl, finalConfig } = getWrapContext(
        _url,
        options,
        mergeConfig(defaultAxiosRequestConfig, axiosRequestConfig),
      );

      return this._axios.delete<T>(finalUrl, finalConfig);
    };
  }

  updateHeaders(headers, { ignoreCache }) {
    if (!headers || headers[CACHE_HEADER]) return headers;

    headers[CACHE_HEADER] = ignoreCache ? 'false' : 'true';
    return headers;
  }
}
