import { AxiosResponse, AxiosRequestConfig, AxiosInstance, mergeConfig } from 'axios';
import { Response } from '../types';

export class Service<T> {
  protected _axios!: AxiosInstance;
  protected _basePath!: string;

  constructor(axios: AxiosInstance, basePath: string) {
    this._axios = axios;
    this._basePath = basePath;
  }

  protected handleSuccess(res: AxiosResponse<any, any>, extra = {}) {
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
}
