import axios, { CreateAxiosDefaults, mergeConfig } from 'axios';
import { ModelService } from './service';
import { Model } from './model';
import { ModelPromise } from './types';
import castArray from 'lodash/castArray';

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

export function createAdapter(axiosConfig?: CreateAxiosDefaults, egoseOptions?: { rootRouterPath?: string }) {
  const merged = mergeConfig(defaultAxiosConfig, axiosConfig ?? {});
  const instance = axios.create(merged);
  const { rootRouterPath = 'macl' } = egoseOptions ?? {};

  return Object.freeze({
    axios: instance,
    createModelService: <T>({
      modelName,
      basePath,
      queryPath = '__query',
      mutationPath = '__mutation',
    }: {
      modelName: string;
      basePath: string;
      queryPath?: string;
      mutationPath?: string;
    }) => {
      return new ModelService<T>({ axios: instance, modelName, basePath, queryPath, mutationPath });
    },
    group: async <T extends ModelPromise<unknown>[]>(
      ...proms: T
    ): Promise<{ [K in keyof T]: T[K] extends ModelPromise<infer U> ? U : never }> => {
      let lastConfig;
      const defs = proms.map((prom) => {
        if (prom.__requestConfig) lastConfig = prom.__requestConfig;
        return prom.__query;
      });

      const result = await instance.post(rootRouterPath, defs, lastConfig ?? {}).then((res) => {
        return res.data.map(({ success, data, count, totalCount, message, errors, statusCode, op }, index) => {
          const service = proms[index].__service;
          let _raw = data;
          let _data = data;

          if (op === 'list') {
            _data = success ? castArray(data).map((item) => Model.create(item, service)) : [];
          } else if (op === 'create') {
            if (success) {
              if (data.length === 1) {
                _data = Model.create(data[0], service);
                _raw = data[0];
              } else {
                _data = data.map((item) => Model.create(item, service));
              }
            } else {
              _raw = null;
              _data = null;
            }
          } else if (['empty', 'read', 'update'].includes(op)) {
            _data = success ? Model.create(data, service) : null;
          }

          return {
            success,
            raw: _raw,
            data: _data,
            message,
            status: statusCode,
            totalCount,
            headers: {},
          };
        }) as {
          [K in keyof T]: T[K] extends ModelPromise<infer U> ? U : never;
        };
      });

      return result;
    },
  });
}
