import express, { Express, Router } from 'express';
import { get, isArray, castArray, compact, isFunction, orderBy } from 'lodash';
import egose, { RootRouter, ModelRouter } from '@egose/acl';
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
  isGlobalPermissionsMethod,
  isDocPermissionsMethod,
  isBaseFilterMethod,
  isValidateMethod,
  isPrepareMethod,
  isTransformMethod,
  isDecorateMethod,
  isDecorateAllMethod,
  isRouteGuardMethod,
} from './helpers/metadata';
import { Type } from './interfaces';

/**
 * @publicApi
 */
export class EgoseFactoryStatic {
  private _expressApp!: Express;
  private _rrouter!: RootRouter;
  private _router!: ModelRouter;
  private _moduleInstance!: any;
  private _routerInstance!: any;

  public bootstrap(module: Type<any>, expressApp: Express) {
    this._expressApp = expressApp;
    const routers = getMetadata(module, 'routers') || [];
    const globalOptions = getMetadata(module, 'options') || {};

    egose.set(globalOptions);
    this.bootstrapGlobalScope(module);

    const expressRouter = express.Router();
    const baseUrl = globalOptions.baseUrl || '/';

    for (let x = 0; x < routers.length; x++) {
      const router = routers[x];
      if (isRootRouter(router)) this.bootstrapRootRouterScope(router, expressRouter);
      else if (isModelRouter(router)) this.bootstrapRouterScope(router, expressRouter);
    }

    this._expressApp.use(baseUrl, expressRouter);

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

  private bootstrapGlobalScope(module: Type<any>) {
    this._moduleInstance = new module();
    this.setGlobalPropertyOptions();
    const methodNames = new Set(getAllMethodNames(module.prototype));

    for (const methodName of methodNames) {
      const globalPermissions = isGlobalPermissionsMethod(this._moduleInstance, methodName);

      if (globalPermissions) this.setGlobalMethodOptions(methodName, 'globalPermissions', false);
    }

    this._expressApp.use(egose());
  }

  private bootstrapRootRouterScope(router: Type<any>, expressRouter: Router) {
    const options = getMetadata(router, ROUTER_OPTIONS);

    this._rrouter = egose.createRouter(options);
    expressRouter.use(this._rrouter.routes);
  }

  private bootstrapRouterScope(router: Type<any>, expressRouter: Router) {
    const modelName = getMetadata(router, ROUTER_MODEL);
    const options = getMetadata(router, ROUTER_OPTIONS);

    this._router = egose.createRouter(modelName, options);
    this._routerInstance = new router();
    this.setRouterPropertyOptions();

    const methodNames = new Set(getAllMethodNames(router.prototype));
    for (const methodName of methodNames) {
      const docPermissions = isDocPermissionsMethod(this._routerInstance, methodName);
      const baseFilter = isBaseFilterMethod(this._routerInstance, methodName);
      const validate = isValidateMethod(this._routerInstance, methodName);
      const prepare = isPrepareMethod(this._routerInstance, methodName);
      const transform = isTransformMethod(this._routerInstance, methodName);
      const decorate = isDecorateMethod(this._routerInstance, methodName);
      const decorateAll = isDecorateAllMethod(this._routerInstance, methodName);
      const routeGuard = isRouteGuardMethod(this._routerInstance, methodName);

      if (docPermissions) this.setRouterMethodOptions(methodName, 'docPermissions', false);
      if (baseFilter) this.setRouterMethodOptions(methodName, 'baseFilter', false);
      if (validate) this.setRouterMethodOptions(methodName, 'validate', true);
      if (prepare) this.setRouterMethodOptions(methodName, 'prepare', true);
      if (transform) this.setRouterMethodOptions(methodName, 'transform', true);
      if (decorate) this.setRouterMethodOptions(methodName, 'decorate', true);
      if (decorateAll) this.setRouterMethodOptions(methodName, 'decorateAll', true);
      if (routeGuard) this.setRouterMethodOptions(methodName, 'routeGuard', false);
    }

    expressRouter.use(this._router.routes);
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

  private setGlobalMethodOptions(methodName: string, optionKey: string, arrayType = false) {
    const fn = this.wrapMethod(this._moduleInstance, methodName, optionKey);
    if (!fn) return;

    if (arrayType) {
      const curr = castArray(compact(egose.getGlobalOption(optionKey)));
      egose.set(optionKey, [...curr, fn]);
    } else {
      egose.set(optionKey, fn);
    }
  }

  private setGlobalPropertyOptions() {
    const optionProps: { optionKey: string; propertyKey: string }[] =
      getMetadata(this._moduleInstance, OPTIONS_METADATA) || [];

    for (let x = 0; x < optionProps.length; x++) {
      const optionProp = optionProps[x];
      const value = this._moduleInstance[optionProp.propertyKey];
      egose.set(optionProp.optionKey, value);
    }
  }

  private setRouterMethodOptions(methodName: string, optionKey: string, arrayType = false) {
    const keys = getMethodMetadataKeysStartWith(this._routerInstance, methodName, optionKey);
    for (let x = 0; x < keys.length; x++) {
      const key = keys[x];
      const val = getMethodMetadata(this._routerInstance, methodName, key);
      if (val !== true) continue;

      const fn = this.wrapMethod(this._routerInstance, methodName, optionKey);
      if (!fn) continue;

      if (arrayType) {
        const curr = castArray(compact(get(this._router.options, key)));
        this._router.set(key, [...curr, fn]);
      } else {
        this._router.set(key, fn);
      }
    }
  }

  private setRouterPropertyOptions() {
    const optionProps: { optionKey: string; propertyKey: string }[] =
      getMetadata(this._routerInstance, OPTIONS_METADATA) || [];

    for (let x = 0; x < optionProps.length; x++) {
      const optionProp = optionProps[x];
      const value = this._routerInstance[optionProp.propertyKey];
      this._router.set(optionProp.optionKey, value);
    }
  }
}

export const EgoseFactory = new EgoseFactoryStatic();
