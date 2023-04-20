import { OptionsManager } from './manager';
import { ModelRouterOptions } from '../interfaces';

export const DEFAULT_QUERY_PATH = '__query';
export const DEFAULT_MUTATION_PATH = '__mutation';

const defaultModelOptions = new OptionsManager<ModelRouterOptions>({
  listHardLimit: 1000,
  permissionField: '_permissions',
  idParam: 'id',
  identifier: '_id',
  queryPath: DEFAULT_QUERY_PATH,
  mutationPath: DEFAULT_MUTATION_PATH,
  routeGuard: false,
}).build();

export const setDefaultModelOptions = (options: ModelRouterOptions) => {
  defaultModelOptions.assign(options);
  return defaultModelOptions.fetch();
};

export const setDefaultModelOption = (key: string, value: any) => {
  defaultModelOptions.set(key, value);
};

export const getDefaultModelOptions = () => {
  return defaultModelOptions.fetch();
};

export const getDefaultModelOption = (key: string, defaultValue?: any) => {
  return defaultModelOptions.get(key, defaultValue);
};
