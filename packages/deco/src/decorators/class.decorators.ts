import 'reflect-metadata';
import isString from 'lodash/isString';
import isPlainObject from 'lodash/isPlainObject';
import { RootRouterOptions, ModelRouterOptions, DefaultModelRouterOptions } from '@egose/acl';
import { ModuleMetadata } from '../interfaces';
import {
  ROOT_ROUTER_WATERMARK,
  ROUTER_WATERMARK,
  DEFAULT_MODEL_ROUTER_OPTIONS_WATERMARK,
  MODEL_ROUTER_OPTIONS_WATERMARK,
  ROUTER_MODEL,
  ROUTER_OPTIONS,
} from '../constants';

export function Module(metadata: ModuleMetadata): ClassDecorator {
  return (target: object) => {
    for (const property in metadata) {
      if (metadata.hasOwnProperty(property)) {
        Reflect.defineMetadata(property, (metadata as any)[property], target);
      }
    }
  };
}

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

export const Router = function Router(
  modelNameOrOptions: string | RootRouterOptions,
  options?: ModelRouterOptions,
): ClassDecorator {
  if (isString(modelNameOrOptions)) {
    return createModelRouter(modelNameOrOptions, options);
  }

  if (arguments.length === 1 && isPlainObject(modelNameOrOptions)) {
    return createRootRouter(modelNameOrOptions as RootRouterOptions);
  }
} as {
  (modelName: string, options?: ModelRouterOptions): ClassDecorator;
  (options: RootRouterOptions): ClassDecorator;
};

function createDefaultModelRouterOptions(options: DefaultModelRouterOptions): ClassDecorator {
  return (target: object) => {
    Reflect.defineMetadata(DEFAULT_MODEL_ROUTER_OPTIONS_WATERMARK, true, target);
    Reflect.defineMetadata(ROUTER_OPTIONS, options || {}, target);
  };
}

function createModelRouterOptions(modelName: string, options?: ModelRouterOptions): ClassDecorator {
  return (target: object) => {
    Reflect.defineMetadata(MODEL_ROUTER_OPTIONS_WATERMARK, true, target);
    Reflect.defineMetadata(ROUTER_MODEL, modelName, target);
    Reflect.defineMetadata(ROUTER_OPTIONS, options || {}, target);
  };
}

export const RouterOptions = function RouterOptions(
  modelNameOrOptions: string | DefaultModelRouterOptions,
  options?: ModelRouterOptions,
): ClassDecorator {
  if (isString(modelNameOrOptions)) {
    return createModelRouterOptions(modelNameOrOptions, options);
  }

  if (arguments.length === 1 && isPlainObject(modelNameOrOptions)) {
    return createDefaultModelRouterOptions(modelNameOrOptions as DefaultModelRouterOptions);
  }
} as {
  (modelName: string, options?: ModelRouterOptions): ClassDecorator;
  (options: DefaultModelRouterOptions): ClassDecorator;
};
