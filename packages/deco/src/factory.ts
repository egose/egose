import express, { Express, Router } from 'express';
import { get, isArray, castArray, compact, isFunction, orderBy } from 'lodash';
import egose, {
  RootRouter,
  ModelRouter,
  GlobalOptions,
  DefaultModelRouterOptions,
  ExtendedDefaultModelRouterOptions,
  ExtendedModelRouterOptions,
  ModelRouterOptions,
} from '@egose/acl';
import {
  ROOT_ROUTER_WATERMARK,
  ROUTER_WATERMARK,
  ROUTER_MODEL,
  ROUTER_OPTIONS,
  OPTIONS_METADATA,
  ARGS_METADATA,
  ARGS,
  HookParamtypes,
} from './constants';
import {
  getMetadata,
  getMethodMetadata,
  getAllMethodNames,
  getMethodDescriptor,
  getMethodMetadataKeysStartWith,
  isRootRouter,
  isModelRouter,
  isDefaultModelRouterOptions,
  isModelRouterOptions,
  isGlobalPermissionsMethod,
  isDocPermissionsMethod,
  isBaseFilterMethod,
  isValidateMethod,
  isPrepareMethod,
  isTransformMethod,
  isDecorateMethod,
  isDecorateAllMethod,
  isRouteGuardMethod,
  isIdentifierMethod,
} from './helpers/metadata';
import { Type } from './interfaces';

/**
 * @publicApi
 */
export class EgoseFactoryStatic {
  private _expressApp!: Express;

  public bootstrap(module: Type<any>, expressApp: Express) {
    this._expressApp = expressApp;
    const routers = getMetadata(module, 'routers') || [];
    const routerOptions = getMetadata(module, 'routerOptions') || [];
    const globalOptions = getMetadata(module, 'options') || {};

    egose.set(globalOptions);
    this.bootstrapEgose(module);

    const expressRouter = express.Router();
    const basePath = globalOptions.basePath || '/';

    for (let x = 0; x < routers.length; x++) {
      const router = routers[x];
      if (isRootRouter(router)) this.bootstrapRootRouter(router, expressRouter);
      else if (isModelRouter(router)) this.bootstrapModelRouter(router, expressRouter);
    }

    for (let x = 0; x < routerOptions.length; x++) {
      const routerOption = routerOptions[x];
      if (isDefaultModelRouterOptions(routerOption)) this.setDefaultModelRouterOptions(routerOption);
      else if (isModelRouterOptions(routerOption)) this.setModelRouterOptions(routerOption);
    }

    this._expressApp.use(basePath, expressRouter);

    if (globalOptions.handleErrors) {
      // catch 404 and forward to error handler
      this._expressApp.use((req, res, next) => {
        const err = new Error('Not Found');
        next(err);
      });

      // error handler
      this._expressApp.use((err, req, res, next) => {
        res.status(err.status || 500);
        res.json({
          message: err.message,
          error: err,
        });
      });
    }
  }

  private bootstrapEgose(module: Type<any>) {
    const moduleInstance = new module();
    this.setGlobalPropertyOptions(moduleInstance);
    const methodNames = new Set(getAllMethodNames(module.prototype));

    for (const methodName of methodNames) {
      const globalPermissions = isGlobalPermissionsMethod(moduleInstance, methodName);

      if (globalPermissions) this.setGlobalMethodOption(moduleInstance, methodName, 'globalPermissions', false);
    }

    this._expressApp.use(egose());
  }

  private bootstrapRootRouter(router, expressRouter: Router) {
    const options = getMetadata(router, ROUTER_OPTIONS);

    const rootRouter = egose.createRouter(options);
    expressRouter.use(rootRouter.routes);
  }

  private bootstrapModelRouter(DecoRouter, expressRouter: Router) {
    const modelName = getMetadata(DecoRouter, ROUTER_MODEL) as string;
    const options = getMetadata(DecoRouter, ROUTER_OPTIONS) as ModelRouterOptions;

    const modelRouter = egose.createRouter(modelName, options);
    this.setModelRouterPropertyOptions(modelName, DecoRouter);
    this.setModelRouterMethodOptions(modelName, DecoRouter);

    expressRouter.use(modelRouter.routes);
  }

  private setDefaultModelRouterOptions(DecoRouterOptions) {
    const options = getMetadata(DecoRouterOptions, ROUTER_OPTIONS) as DefaultModelRouterOptions;

    egose.setDefaultModelOptions(options);

    this.setDefaultModelRouterPropertyOptions(DecoRouterOptions);
    this.setDefaultModelRouterMethodOptions(DecoRouterOptions);
  }

  private setModelRouterOptions(DecoRouterOptions) {
    const modelName = getMetadata(DecoRouterOptions, ROUTER_MODEL) as string;
    const options = getMetadata(DecoRouterOptions, ROUTER_OPTIONS) as ModelRouterOptions;

    egose.setModelOptions(modelName, options);

    this.setModelRouterPropertyOptions(modelName, DecoRouterOptions);
    this.setModelRouterMethodOptions(modelName, DecoRouterOptions);
  }

  private setModelRouterPropertyOptions(modelName: string, DecoRouterOrOptions) {
    const instance = new DecoRouterOrOptions();
    const optionProps: { optionKey: keyof ExtendedModelRouterOptions; propertyKey: string }[] =
      getMetadata(instance, OPTIONS_METADATA) || [];

    for (let x = 0; x < optionProps.length; x++) {
      const optionProp = optionProps[x];
      const value = instance[optionProp.propertyKey];
      egose.setModelOption(modelName, optionProp.optionKey, value);
    }
  }

  private setModelRouterMethodOptions(modelName: string, DecoRouterOrOptions) {
    const instance = new DecoRouterOrOptions();
    const methodNames = new Set(getAllMethodNames(DecoRouterOrOptions.prototype));

    for (const methodName of methodNames) {
      if (isDocPermissionsMethod(instance, methodName))
        this.setModelRouterMethodOption(instance, methodName, modelName, 'docPermissions', false);
      else if (isBaseFilterMethod(instance, methodName))
        this.setModelRouterMethodOption(instance, methodName, modelName, 'baseFilter', false);
      else if (isValidateMethod(instance, methodName))
        this.setModelRouterMethodOption(instance, methodName, modelName, 'validate', true);
      else if (isPrepareMethod(instance, methodName))
        this.setModelRouterMethodOption(instance, methodName, modelName, 'prepare', true);
      else if (isTransformMethod(instance, methodName))
        this.setModelRouterMethodOption(instance, methodName, modelName, 'transform', true);
      else if (isDecorateMethod(instance, methodName))
        this.setModelRouterMethodOption(instance, methodName, modelName, 'decorate', true);
      else if (isDecorateAllMethod(instance, methodName))
        this.setModelRouterMethodOption(instance, methodName, modelName, 'decorateAll', true);
      else if (isRouteGuardMethod(instance, methodName))
        this.setModelRouterMethodOption(instance, methodName, modelName, 'routeGuard', false);
      else if (isIdentifierMethod(instance, methodName))
        this.setModelRouterMethodOption(instance, methodName, modelName, 'identifier', false);
    }
  }

  private setDefaultModelRouterPropertyOptions(DecoRouterOptions) {
    const instance = new DecoRouterOptions();
    const optionProps: { optionKey: keyof ExtendedDefaultModelRouterOptions; propertyKey: string }[] =
      getMetadata(instance, OPTIONS_METADATA) || [];

    for (let x = 0; x < optionProps.length; x++) {
      const optionProp = optionProps[x];
      const value = instance[optionProp.propertyKey];
      egose.setDefaultModelOption(optionProp.optionKey, value);
    }
  }

  private setDefaultModelRouterMethodOptions(DecoRouterOptions) {
    const instance = new DecoRouterOptions();
    const methodNames = new Set(getAllMethodNames(DecoRouterOptions.prototype));

    for (const methodName of methodNames) {
      if (isRouteGuardMethod(instance, methodName))
        this.setDefaultModelRouterMethodOption(instance, methodName, 'routeGuard', false);
    }
  }

  private setGlobalPropertyOptions(moduleInstance) {
    const optionProps: { optionKey: keyof GlobalOptions; propertyKey: string }[] =
      getMetadata(moduleInstance, OPTIONS_METADATA) || [];

    for (let x = 0; x < optionProps.length; x++) {
      const optionProp = optionProps[x];
      const value = moduleInstance[optionProp.propertyKey];
      egose.setGlobalOption(optionProp.optionKey, value);
    }
  }

  private setGlobalMethodOption(moduleInstance, methodName: string, optionKey: keyof GlobalOptions, arrayType = false) {
    const fn = this.wrapMethod(moduleInstance, methodName, optionKey);
    if (!fn) return;

    if (arrayType) {
      const curr = castArray(compact(egose.getGlobalOption(optionKey)));
      egose.setGlobalOption(optionKey, [...curr, fn] as any);
    } else {
      egose.setGlobalOption(optionKey, fn);
    }
  }

  private setModelRouterMethodOption(
    routerOrOptions,
    methodName: string,
    modelName: string,
    optionKey: string,
    arrayType = false,
  ) {
    const keys = getMethodMetadataKeysStartWith(routerOrOptions, methodName, optionKey);
    for (let x = 0; x < keys.length; x++) {
      const key = keys[x];
      const val = getMethodMetadata(routerOrOptions, methodName, key);
      if (val !== true) continue;

      const fn = this.wrapMethod(routerOrOptions, methodName, optionKey);
      if (!fn) continue;

      if (arrayType) {
        const curr = castArray(compact(egose.getModelOption(modelName, key)));
        egose.setModelOption(modelName, key, [...curr, fn]);
      } else {
        egose.setModelOption(modelName, key, fn);
      }
    }
  }

  private setDefaultModelRouterMethodOption(routerOption, methodName: string, optionKey: string, arrayType = false) {
    const keys = getMethodMetadataKeysStartWith(routerOption, methodName, optionKey);
    for (let x = 0; x < keys.length; x++) {
      const key = keys[x];
      const val = getMethodMetadata(routerOption, methodName, key);
      if (val !== true) continue;

      const fn = this.wrapMethod(routerOption, methodName, optionKey);
      if (!fn) continue;

      if (arrayType) {
        const curr = castArray(compact(egose.getDefaultModelOption(key)));
        egose.setDefaultModelOption(key, [...curr, fn]);
      } else {
        egose.setDefaultModelOption(key, fn);
      }
    }
  }

  private wrapMethod(target: object, methodName: string, optionKey: string) {
    const dtor = getMethodDescriptor(target, methodName);
    if (!isFunction(dtor.value)) return null;

    const arglist = ARGS[optionKey];
    const metalist = Reflect.getMetadata(ARGS_METADATA, target.constructor, methodName);

    return function (...args) {
      const ordered = orderBy(metalist, ['index'], ['asc']).map((meta) => {
        if (meta.type === HookParamtypes.REQUEST) return this;

        const index = arglist.findIndex((v) => v === meta.type);
        return args[index];
      });

      return dtor.value.call(target, ...ordered);
    };
  }
}

export const EgoseFactory = new EgoseFactoryStatic();
