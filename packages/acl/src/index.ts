import isString from 'lodash/isString';
import isObject from 'lodash/isObject';
import isPlainObject from 'lodash/isPlainObject';
import isUndefined from 'lodash/isUndefined';
import middleware, { guard } from './middleware';
import { RootRouter, ModelRouter } from './routers';
import {
  setGlobalOptions,
  setGlobalOption,
  getGlobalOptions,
  getGlobalOption,
  setModelOptions,
  setModelOption,
  getModelOptions,
  getModelOption,
  getModelNames,
  getModelJsonSchema,
  setDefaultModelOptions,
  setDefaultModelOption,
  getDefaultModelOptions,
  getDefaultModelOption,
} from './options';
import { GlobalOptions, RootRouterOptions, ModelRouterOptions } from './interfaces';
export {
  RootRouter,
  ModelRouter,
  guard,
  setGlobalOptions,
  setGlobalOption,
  getGlobalOptions,
  getGlobalOption,
  setModelOptions,
  setModelOption,
  getModelOptions,
  getModelOption,
  getModelNames,
  getModelJsonSchema,
  setDefaultModelOptions,
  setDefaultModelOption,
  getDefaultModelOptions,
  getDefaultModelOption,
};
export * from './permission';
export * from './plugins';
export * from './interfaces';
export * from './symbols';
export * from './enums';

type CreateRouter = {
  (modelName: string, options: ModelRouterOptions): ModelRouter;
  (options: RootRouterOptions): RootRouter;
};

type EgoseSet = {
  <K extends keyof GlobalOptions>(key: K, value: GlobalOptions[K]): void;
  (options: { [K in keyof GlobalOptions]: GlobalOptions[K] }): void;
};

interface Egose {
  createRouter: CreateRouter;
  set: EgoseSet;
  setGlobalOptions: typeof setGlobalOptions;
  setGlobalOption: typeof setGlobalOption;
  getGlobalOptions: typeof getGlobalOptions;
  getGlobalOption: typeof getGlobalOption;
  setModelOptions: typeof setModelOptions;
  setModelOption: typeof setModelOption;
  getModelOptions: typeof getModelOptions;
  getModelOption: typeof getModelOption;
  getModelNames: typeof getModelNames;
  getModelJsonSchema: typeof getModelJsonSchema;
  setDefaultModelOptions: typeof setDefaultModelOptions;
  setDefaultModelOption: typeof setDefaultModelOption;
  getDefaultModelOptions: typeof getDefaultModelOptions;
  getDefaultModelOption: typeof getDefaultModelOption;
  RootRouter: typeof RootRouter;
  ModelRouter: typeof ModelRouter;
}

const egose = middleware as typeof middleware & Egose;

egose.createRouter = function (modelName: string | RootRouterOptions, options: ModelRouterOptions | undefined) {
  return isUndefined(options)
    ? new RootRouter(modelName as RootRouterOptions)
    : new ModelRouter(modelName as string, options);
} as CreateRouter;

egose.set = function <K extends keyof GlobalOptions>(keyOrOptions: K | GlobalOptions, value?: unknown) {
  if (arguments.length === 2 && isString(keyOrOptions)) {
    return setGlobalOption(keyOrOptions as K, value as GlobalOptions[K]);
  }

  if (arguments.length === 1 && isPlainObject(keyOrOptions)) {
    return setGlobalOptions(keyOrOptions as GlobalOptions);
  }
};

egose.setGlobalOptions = setGlobalOptions;
egose.setGlobalOption = setGlobalOption;
egose.getGlobalOptions = getGlobalOptions;
egose.getGlobalOption = getGlobalOption;
egose.setModelOptions = setModelOptions;
egose.setModelOption = setModelOption;
egose.getModelOptions = getModelOptions;
egose.getModelOption = getModelOption;
egose.setDefaultModelOptions = setDefaultModelOptions;
egose.setDefaultModelOption = setDefaultModelOption;
egose.getDefaultModelOptions = getDefaultModelOptions;
egose.getDefaultModelOption = getDefaultModelOption;
egose.RootRouter = RootRouter;
egose.ModelRouter = ModelRouter;

export default egose;
