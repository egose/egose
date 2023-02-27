import { Request, Response, NextFunction } from 'express';
import isNil from 'lodash/isNil';
import isUndefined from 'lodash/isUndefined';
import middleware from './middleware';
import { RootRouter, ModelRouter } from './router';
import { setGlobalOption, setGlobalOptions, getGlobalOption } from './options';
import { GlobalOptions, RootRouterOptions, ModelRouterOptions } from './interfaces';
export * from './router';
export * from './options';
export * from './interfaces';
export * from './symbols';

type Middleware = () => (req: Request, res: Response, next: NextFunction) => Promise<void>;
interface ModelRouterConstructor {
  new (modelName: string, options: ModelRouterOptions): ModelRouter;
}

type CreateRouter = {
  (modelName: string, options: ModelRouterOptions): ModelRouter;
  (options: RootRouterOptions): RootRouter;
};

interface MACL {
  createRouter: CreateRouter;
  set: (keyOrOptions: string | GlobalOptions, value?: any) => void;
  setGlobalOption: (optionKey: string, value: any) => void;
  setGlobalOptions: (options: GlobalOptions) => void;
  getGlobalOption: (optionKey: string, defaultValue?: any) => any;
  ModelRouter: ModelRouterConstructor;
}

const macl = middleware as Middleware & MACL;
macl.createRouter = function (modelName: string | RootRouterOptions, options: ModelRouterOptions | undefined) {
  return isUndefined(options)
    ? new RootRouter(modelName as RootRouterOptions)
    : new ModelRouter(modelName as string, options);
} as CreateRouter;

macl.set = (keyOrOptions, value) =>
  isNil(value) ? setGlobalOptions(keyOrOptions as GlobalOptions) : setGlobalOption(keyOrOptions as string, value);
macl.setGlobalOption = setGlobalOption;
macl.setGlobalOptions = setGlobalOptions;
macl.getGlobalOption = getGlobalOption;
macl.ModelRouter = ModelRouter;

export default macl;
