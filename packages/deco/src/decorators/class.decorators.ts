import 'reflect-metadata';
import { isString } from 'lodash';
import { RootRouterOptions, ModelRouterOptions } from '@egose/acl';
import { ModuleMetadata } from '../interfaces';
import { ROOT_ROUTER_WATERMARK, ROUTER_WATERMARK, ROUTER_MODEL, ROUTER_OPTIONS } from '../constants';

export function Module(metadata: ModuleMetadata): ClassDecorator {
  return (target: object) => {
    for (const property in metadata) {
      if (metadata.hasOwnProperty(property)) {
        Reflect.defineMetadata(property, (metadata as any)[property], target);
      }
    }
  };
}

type CommonRouter = {
  (modelName: string, options?: ModelRouterOptions): ClassDecorator;
  (options: RootRouterOptions): ClassDecorator;
};

function createRootRouter(options: RootRouterOptions): ClassDecorator {
  return (target: object) => {
    Reflect.defineMetadata(ROOT_ROUTER_WATERMARK, true, target);
    Reflect.defineMetadata(ROUTER_OPTIONS, options || {}, target);
  };
}

function createModelRouter(modelName: string, options?: ModelRouterOptions): ClassDecorator {
  return (target: object) => {
    Reflect.defineMetadata(ROUTER_WATERMARK, true, target);
    Reflect.defineMetadata(ROUTER_MODEL, modelName, target);
    Reflect.defineMetadata(ROUTER_OPTIONS, options || {}, target);
  };
}

const commonRouter = function Router(
  modelName: string | RootRouterOptions,
  options?: ModelRouterOptions,
): ClassDecorator {
  return isString(modelName) ? createModelRouter(modelName, options) : createRootRouter(modelName);
} as CommonRouter;

export const Router = commonRouter;
