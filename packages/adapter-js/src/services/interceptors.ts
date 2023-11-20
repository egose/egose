import { AxiosInstance, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { CACHE_HEADER } from '../constants';

class SimpleCache<T> {
  private cache: { [key: string]: T } = {};

  set(key: string, value: T): void {
    this.cache[key] = value;
  }

  get(key: string): T | undefined {
    return this.cache[key];
  }

  has(key: string): boolean {
    return key in this.cache;
  }

  delete(key: string): boolean {
    if (this.has(key)) {
      delete this.cache[key];
      return true;
    }
    return false;
  }

  clear(): void {
    this.cache = {};
  }

  size(): number {
    return Object.keys(this.cache).length;
  }

  keys(): string[] {
    return Object.keys(this.cache);
  }

  values(): T[] {
    return Object.values(this.cache);
  }

  entries(): [string, T][] {
    return Object.entries(this.cache);
  }
}

const store = new SimpleCache<AxiosResponse>();

export function useCacheInterceptors(instance: AxiosInstance, cacheTTL: number) {
  instance.interceptors.request.use(
    async (config) => {
      if (config.headers[CACHE_HEADER] === 'false') return config;

      const key = generateCacheKey(config);

      if (store.has(key)) {
        const prevConfig = store.get(key);
        prevConfig.headers[CACHE_HEADER] = 'true';
        config.adapter = function (_config) {
          return new Promise((resolve, reject) => {
            return resolve({ ...prevConfig, config: _config });
          });
        };
      }

      return config;
    },
    (error) => {
      return Promise.reject(error);
    },
  );

  instance.interceptors.response.use(
    (response) => {
      const key = generateCacheKey(response.config);
      store.set(key, response);
      setTimeout(() => store.delete(key), cacheTTL);
      return response;
    },
    (error) => {
      return Promise.reject(error);
    },
  );
}

function generateCacheKey(config: InternalAxiosRequestConfig) {
  const key = `${config.baseURL}/${config.url}_${config.method}_${generateParamKey(config.params)}_${generateDataKey(
    config.data,
  )}`;

  return encodeURI(key);
}

function generateParamKey(params: Record<string, any>) {
  if (!params) return '';
  return JSON.stringify(params);
}

function generateDataKey(data: string) {
  if (!data) return '';
  return data;
}
