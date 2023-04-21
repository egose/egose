import isNil from 'lodash/isNil';
import isUndefined from 'lodash/isUndefined';
import middleware, { guard } from './middleware';
import { RootRouter, ModelRouter } from './routers';
import {
  setGlobalOptions,
  setGlobalOption,
  getGlobalOptions,
  getGlobalOption,
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
  setDefaultModelOptions,
  setDefaultModelOption,
  getDefaultModelOptions,
  getDefaultModelOption,
};
export * from './permission';
export * from './plugins';
export * from './interfaces';
export * from './symbols';

type CreateRouter = {
  (modelName: string, options: ModelRouterOptions): ModelRouter;
  (options: RootRouterOptions): RootRouter;
};

interface Egose {
  createRouter: CreateRouter;
  set: (keyOrOptions: string | GlobalOptions, value?: any) => void;
  setGlobalOptions: typeof setGlobalOptions;
  setGlobalOption: typeof setGlobalOption;
  getGlobalOptions: typeof getGlobalOptions;
  getGlobalOption: typeof getGlobalOption;
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

egose.set = (keyOrOptions, value) =>
  isNil(value) ? setGlobalOptions(keyOrOptions as GlobalOptions) : setGlobalOption(keyOrOptions as string, value);

egose.setGlobalOptions = setGlobalOptions;
egose.setGlobalOption = setGlobalOption;
egose.getGlobalOptions = getGlobalOptions;
egose.getGlobalOption = getGlobalOption;
egose.setDefaultModelOptions = setDefaultModelOptions;
egose.setDefaultModelOption = setDefaultModelOption;
egose.getDefaultModelOptions = getDefaultModelOptions;
egose.getDefaultModelOption = getDefaultModelOption;
egose.RootRouter = RootRouter;
egose.ModelRouter = ModelRouter;

export default egose;
