import { AxiosResponse, AxiosRequestConfig, AxiosInstance, mergeConfig } from 'axios';
import { Response } from '../types';
import { CACHE_HEADER } from '../constants';

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

  wrapGet<T>(url: string, defaultAxiosRequestConfig?: AxiosRequestConfig) {
    const _url = `${removeTrailingSlash(this._basePath)}/${removeLeadingSlash(url)}`;
    return (axiosRequestConfig?: AxiosRequestConfig) =>
      this._axios.get<T>(_url, axiosRequestConfig ?? defaultAxiosRequestConfig);
  }

  wrapPost<T>(url: string, defaultAxiosRequestConfig?: AxiosRequestConfig) {
    const _url = `${removeTrailingSlash(this._basePath)}/${removeLeadingSlash(url)}`;
    return (data?: any, axiosRequestConfig?: AxiosRequestConfig) =>
      this._axios.post<T>(_url, data, axiosRequestConfig ?? defaultAxiosRequestConfig);
  }

  wrapPut<T>(url: string, defaultAxiosRequestConfig?: AxiosRequestConfig) {
    const _url = `${removeTrailingSlash(this._basePath)}/${removeLeadingSlash(url)}`;
    return (data?: any, axiosRequestConfig?: AxiosRequestConfig) =>
      this._axios.put<T>(_url, data, axiosRequestConfig ?? defaultAxiosRequestConfig);
  }

  wrapPatch<T>(url: string, defaultAxiosRequestConfig?: AxiosRequestConfig) {
    const _url = `${removeTrailingSlash(this._basePath)}/${removeLeadingSlash(url)}`;
    return (data?: any, axiosRequestConfig?: AxiosRequestConfig) =>
      this._axios.patch<T>(_url, data, axiosRequestConfig ?? defaultAxiosRequestConfig);
  }

  wrapDelete<T>(url: string, defaultAxiosRequestConfig?: AxiosRequestConfig) {
    const _url = `${removeTrailingSlash(this._basePath)}/${removeLeadingSlash(url)}`;
    return (axiosRequestConfig?: AxiosRequestConfig) =>
      this._axios.delete<T>(_url, axiosRequestConfig ?? defaultAxiosRequestConfig);
  }

  updateHeaders(headers, { ignoreCache }) {
    if (!headers || headers[CACHE_HEADER]) return headers;

    headers[CACHE_HEADER] = ignoreCache ? 'false' : 'true';
    return headers;
  }
}
