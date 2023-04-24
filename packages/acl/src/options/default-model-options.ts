import { OptionsManager } from './manager';
import { DefaultModelRouterOptions, ExtendedDefaultModelRouterOptions } from '../interfaces';

export const DEFAULT_QUERY_PATH = '__query';
export const DEFAULT_MUTATION_PATH = '__mutation';

const defaultModelOptions = new OptionsManager<DefaultModelRouterOptions, ExtendedDefaultModelRouterOptions>({
  listHardLimit: 1000,
  permissionField: '_permissions',
  idParam: 'id',
  identifier: '_id',
  parentPath: '/',
  queryPath: DEFAULT_QUERY_PATH,
  mutationPath: DEFAULT_MUTATION_PATH,
  routeGuard: false,
}).build();

export const setDefaultModelOptions = (options: DefaultModelRouterOptions) => {
  defaultModelOptions.assign(options);
};

export const setDefaultModelOption = <K extends keyof ExtendedDefaultModelRouterOptions>(
  key: K,
  value: ExtendedDefaultModelRouterOptions[K],
) => {
  defaultModelOptions.set(key, value);
};

export const getDefaultModelOptions = () => {
  return defaultModelOptions.fetch();
};

export const getDefaultModelOption = <K extends keyof ExtendedDefaultModelRouterOptions>(
  key: K,
  defaultValue?: ExtendedDefaultModelRouterOptions[K],
) => {
  return defaultModelOptions.get(key, defaultValue);
};
