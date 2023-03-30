import get from 'lodash/get';
import set from 'lodash/set';
import { GlobalOptions, ModelRouterOptions } from './interfaces';

export const DEFAULT_QUERY_PATH = '__query';
export const DEFAULT_MUTATION_PATH = '__mutation';

////////////////////
// Global Options //
////////////////////
const defaultGlobalOptions: GlobalOptions = {
  permissionField: '_permissions',
  globalPermissions: () => ({}),
  idParam: 'id',
  queryPath: DEFAULT_QUERY_PATH,
  mutationPath: DEFAULT_MUTATION_PATH,
};

let currentGlobalOptions = { ...defaultGlobalOptions };

export const setGlobalOptions = (options: GlobalOptions) => {
  currentGlobalOptions = { ...defaultGlobalOptions, ...currentGlobalOptions, ...options };
};

export const setGlobalOption = (key: string, value: any) => {
  set(currentGlobalOptions, key, value);
};

export const getGlobalOption = (key: string, defaultValue?: any) => get(currentGlobalOptions, key, defaultValue);

////////////////////
// Model Options //
////////////////////
const defaultModelOptions: ModelRouterOptions = {
  baseUrl: null,
  listHardLimit: 1000,
  permissionField: '_permissions',
  mandatoryFields: [],
  identifier: '_id',
  idParam: '',
  queryPath: '',
  mutationPath: '',
};

let modelOptions = {};

const _syncModelOptions = (modelName: string) => {
  const options = modelOptions[modelName];
  if (!options) return;

  if (options.permissionSchema) {
    options['permissionSchemaKeys'] = Object.keys(options.permissionSchema);
  }
};

export const setModelOptions = (modelName: string, options: ModelRouterOptions): ModelRouterOptions => {
  modelOptions[modelName] = { ...defaultModelOptions, ...(modelOptions[modelName] || {}), ...(options || {}) };
  _syncModelOptions(modelName);
  return modelOptions[modelName];
};

export const setModelOption = (modelName: string, key: string, value: any): ModelRouterOptions => {
  if (!modelOptions[modelName]) modelOptions[modelName] = {};

  set(modelOptions[modelName], key, value);
  _syncModelOptions(modelName);
  return modelOptions[modelName];
};

export const getModelOptions = (modelName: string): ModelRouterOptions => {
  return get(modelOptions, modelName, defaultModelOptions);
};

export const getModelOption = (modelName: string, key: string, defaultValue?: any) => {
  const keys = key.split('.');
  if (keys.length === 1) return get(modelOptions, `${modelName}.${key}`, defaultValue);

  let option = get(modelOptions, `${modelName}.${key}`, undefined);
  if (option) return option;

  const parentKey = keys.slice(0, -1).join('.');
  option = get(modelOptions, `${modelName}.${parentKey}.default`);
  if (option === undefined) option = get(modelOptions, `${modelName}.${parentKey}`, defaultValue);
  return option;
};
