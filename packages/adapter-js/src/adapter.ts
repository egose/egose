import axios, { CreateAxiosDefaults, mergeConfig } from 'axios';
import { ModelService } from './service';

const defaultAxiosConfig = Object.freeze({
  baseURL: '/api',
  timeout: 0,
  withCredentials: true,
  headers: {
    'Cache-Control': 'no-cache',
    Pragma: 'no-cache',
    Expires: '0',
  },
});

export function createAdapter(axiosConfig: CreateAxiosDefaults = {}) {
  const merged = mergeConfig(defaultAxiosConfig, axiosConfig);
  const instance = axios.create(merged);

  return Object.freeze({
    axios: instance,
    createModelService: <T>({
      basePath,
      queryPath = '__query',
      mutationPath = '__mutation',
    }: {
      basePath: string;
      queryPath?: string;
      mutationPath?: string;
    }) => {
      return new ModelService<T>({ axios: instance, basePath, queryPath, mutationPath });
    },
  });
}
