import { Options } from './options';
import { GlobalOptions, ModelRouterOptions } from '../interfaces';

export const DEFAULT_QUERY_PATH = '__query';
export const DEFAULT_MUTATION_PATH = '__mutation';

////////////////////
// Global Options //
////////////////////
const globalOptions = new Options<GlobalOptions>({
  permissionField: '_permissions',
  globalPermissions: () => ({}),
  idParam: 'id',
  queryPath: DEFAULT_QUERY_PATH,
  mutationPath: DEFAULT_MUTATION_PATH,
});

export const setGlobalOptions = (options: GlobalOptions) => {
  return globalOptions.assign(options);
};

export const setGlobalOption = (key: string, value: any) => {
  globalOptions.set(key, value);
};

export const getGlobalOptions = (key: string, defaultValue?: any) => {
  return globalOptions.fetch();
};

export const getGlobalOption = (key: string, defaultValue?: any) => {
  return globalOptions.get(key, defaultValue);
};

////////////////////
// Model Options //
////////////////////
const defaultModelOptions: ModelRouterOptions = {
  basePath: null,
  listHardLimit: 1000,
  permissionField: '_permissions',
  mandatoryFields: [],
  identifier: '_id',
  idParam: '',
  queryPath: '',
  mutationPath: '',
};

const modelOptions = {};

const createModelOptions = () => {
  const _options = new Options<ModelRouterOptions>(defaultModelOptions);
  _options.on('update', function () {
    const permissionSchema = this.get('permissionSchema');
    if (permissionSchema) this._set('permissionSchemaKeys', Object.keys(permissionSchema));
  });

  return _options;
};

const getOrCreateModelOptions = (modelName: string) => {
  let _options: Options<ModelRouterOptions> = modelOptions[modelName];
  if (!_options) {
    _options = createModelOptions();
    modelOptions[modelName] = _options;
  }

  return _options;
};

export const setModelOptions = (modelName: string, options: ModelRouterOptions): ModelRouterOptions => {
  const _options = getOrCreateModelOptions(modelName);
  return _options.assign(options);
};

export const setModelOption = (modelName: string, key: string, value: any): ModelRouterOptions => {
  const _options = getOrCreateModelOptions(modelName);

  _options.set(key, value);
  return _options.fetch();
};

export const getModelOptions = (modelName: string): ModelRouterOptions => {
  const _options = getOrCreateModelOptions(modelName);
  return _options.fetch();
};

export const getModelOption = (modelName: string, key: string, defaultValue?: any) => {
  const _options = getOrCreateModelOptions(modelName);

  const keys = key.split('.');
  if (keys.length === 1) return _options.get(key, defaultValue);

  let option = _options.get(key, undefined);
  if (option) return option;

  const parentKey = keys.slice(0, -1).join('.');
  option = _options.get(`${parentKey}.default`);

  if (option === undefined) option = _options.get(parentKey, defaultValue);
  return option;
};
