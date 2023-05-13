import axios, { CreateAxiosDefaults, mergeConfig } from 'axios';
import isEmpty from 'lodash/isEmpty';
import { ModelService } from './service';
import { Model } from './model';
import { ModelPromiseMeta } from './types';
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
    group: async <T extends (ModelPromiseMeta & Promise<unknown>)[]>(
      ...proms: T
    ): Promise<{ [K in keyof T]: T[K] extends Promise<infer U> ? U : never }> => {
      let lastConfig;
      const defs = proms.map((prom) => {
        if (!isEmpty(prom.__requestConfig)) lastConfig = prom.__requestConfig;
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
          } else if (['new', 'read', 'update'].includes(op)) {
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
          [K in keyof T]: T[K] extends Promise<infer U> ? U : never;
        };
      });

      return result;
    },
  });
}

// TYPE TESTS

// const __adapter = createAdapter({ baseURL: 'http://127.0.0.1:3000/api' });

// interface User {
//   name?: string;
//   role?: string;
//   statusHistory?: any[];
//   public?: boolean;
//   [key: string]: any;
// }

// interface Org {
//   name?: string;
//   locations?: any[];
//   [key: string]: any;
// }

// const __userService = __adapter.createModelService<User>({ modelName: 'User', basePath: 'users' });
// const __orgService = __adapter.createModelService<Org>({ modelName: 'Org', basePath: 'orgs' });

// __userService.update('123456789', {}).then((data) => {
//   data.data.role;
// });

// __adapter.group(__userService.update('123456789', {}), __orgService.updateAdvanced('123456789', {})).then((data) => {
//   data[0].data.role;
//   data[1].data.locations;
// });
